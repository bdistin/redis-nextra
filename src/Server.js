const Connection = require('./Connection.js');
const OfflineQueue = require('./OfflineQueue.js');

class Server {

	/**
	 * @typedef  {Object} ServerConnectionOptions
	 * @property {boolean} socketNoDelay
	 * @property {boolean} socketKeepAlive
	 * @property {number} retryDelay
	 * @property {Host} host
	 */

	/**
	 * @param {RedisClient} client The Redis client.
	 * @param {ServerManager} manager The ServerManager that handles this instance.
	 * @param {Host} host The host object to connect with.
	 */
	constructor(client, manager, host) {
		/**
		 * @type {RedisClient}
		 */
		this.client = client;

		/**
		 * @type {Host}
		 */
		this.host = host;

		/**
		 * @type {boolean}
		 */
		this.connected = false;

		/**
		 * @type {boolean}
		 */
		this.weight = host.weight;

		/**
		 * @type {boolean}
		 */
		this.removeTimeout = manager.serverOptions.removeTimeout;

		/**
		 * @type {number}
		 */
		this.connectionsPerServer = manager.serverOptions.connectionsPerServer || 1;

		/**
		 * @type {boolean}
		 */
		this.enableOfflineQueue = typeof manager.serverOptions.enableOfflineQueue === 'undefined' ? true : !!manager.serverOptions.enableOfflineQueue;

		this.connectionOptions = {
			socketNoDelay: manager.serverOptions.socketNoDelay,
			socketKeepAlive: manager.serverOptions.socketKeepAlive,
			retryDelay: manager.serverOptions.retryDelay,
			host: host
		};

		/**
		 * @type {ServerConnectionOptions}
		 */
		this.offlineQueue = this.enableOfflineQueue ? new OfflineQueue() : null;

		/**
		 * @type {Connection[]}
		 */
		this.connections = this._createConnections();
	}

	/**
	 * Send a command to Redis.
	 * @param {string} cmd The command name to execute.
	 * @param {any[]} args The arguments for the command to execute.
	 * @param {Object} next The Promise to Resolve or Reject.
	 * @returns {Promise<any>}
	 */
	sendCommand(cmd, args, next) {
		if (this.connections.length === 1) {
			const conn = this.connections[0];
			if (conn.connected) return conn.write(cmd, args, next);
		} else {
			const pf = Math.floor(Math.random() * this.connections.length);

			for (let i = 0; i < this.connections.length; i++) {
				const conn = this.connections[(i + pf) % this.connections.length];

				if (conn.connected) {
					conn.write(cmd, args, next);
					return null;
				}
			}
		}

		if (this.offlineQueue) return this.offlineQueue.push(cmd, args, next);
		return next.reject(new Error(`Unable to acquire connection to server ${this.host.string}`));
	}

	/**
	 * Terminate this server instance.
	 * @returns {void}
	 */
	end() {
		for (const conn of this.connections) conn.end();
		this.offlineQueue.flush(new Error(`Server connection lost to ${this.host.string}`));
		this.offlineQueue = null;
		this.connected = false;
		this.ended = true;
	}

	/**
	 * Create connections.
	 * @returns {Connection[]}
	 * @private
	 */
	_createConnections() {
		const conns = [];

		for (let i = 0; i < this.connectionsPerServer; i++) {
			const conn = new Connection(this.client, this.host, this.connectionOptions);
			conn.on('connect', this._checkState.bind(this));
			conn.on('reconnect', this._checkState.bind(this));
			conn.on('error', this._checkState.bind(this));
			conns.push(conn);
		}

		return conns;
	}

	/**
	 * Check the server's state.
	 * @returns {void}
	 * @private
	 */
	_checkState() {
		const oldstate = this.connected;
		this.connected = false;

		if (this.ended) { return; }

		for (let i = 0; i < this.connections.length; i++) {
			if (this.connections[i].connected) { this.connected = true; }
		}

		if (this.connected && !oldstate) this.client.emit('serverConnect', this);

		if (!this.connected) {
			if (this.removeTimeout && !this._removeTimer) {
				this._removeTimer = setTimeout(() => {
					if (this.connected) return;
					this.client.emit('serverRemove', this);
					this.end();
				}, this.removeTimeout);
			} else if (!this.removeTimeout) {
				this.client.emit('serverReconnect', this);
			}
		} else if (this._removeTimer) {
			clearTimeout(this._removeTimer);
			this._removeTimer = null;
		}
	}

}

module.exports = Server;
