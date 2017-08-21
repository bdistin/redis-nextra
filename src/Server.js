const Connection = require('./Connection.js');
const OfflineQueue = require('./OfflineQueue.js');

class Server {

	constructor(client, manager, host) {
		this.client = client;
		this.host = host;
		this.connected = false;
		this.weight = host.weight;
		this.removeTimeout = manager.serverOptions.removeTimeout;
		this.connectionsPerServer = manager.serverOptions.connectionsPerServer || 1;
		this.enableOfflineQueue = typeof manager.serverOptions.enableOfflineQueue === 'undefined' ? true : !!manager.serverOptions.enableOfflineQueue;

		this.connectionOptions = {
			socketNoDelay: manager.serverOptions.socketNoDelay,
			socketKeepAlive: manager.serverOptions.socketKeepAlive,
			retryDelay: manager.serverOptions.retryDelay,
			host: host
		};

		this.offlineQueue = this.enableOfflineQueue ? new OfflineQueue() : null;
		this.connections = this._createConnections();
	}

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

	end() {
		for (const conn of this.connections) conn.end();
		this.offlineQueue.flush(new Error(`Server connection lost to ${this.host.string}`));
		this.offlineQueue = null;
		this.connected = false;
		this.ended = true;
	}

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
