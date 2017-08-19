const EventEmitter = require('events');
const consistent = require('consistent');
const conparse = require('connection-parse');

const Server = require('./Server');
const OfflineQueue = require('./OfflineQueue');
const Script = require('./Script');
const commands = require('./commands');

class Client extends EventEmitter {

	constructor(hosts, options = {}) {
		super();

		this.serverOptions = {
			socketNoDelay: options.socketNoDelay,
			socketKeepAlive: options.socketKeepAlive,
			removeTimeout: options.removeTimeout,
			retryDelay: options.retryDelay,
			connectionsPerServer: options.connectionsPerServer,
			enableOfflineQueue: options.enableOfflineQueue
		};
		this.ready = false;
		this.tables = new Set();
		this.once('ready', () => {
			this.ready = true;
		});
		if (typeof hosts === 'function') {
			this.offlineQueue = new OfflineQueue();

			hosts((err, result) => {
				if (err) {
					this.emit('error', this._makeError({ message: `Discovery failed: ${err.message}`, code: 'DISCOVERY_FAILED' }));
					return this.end();
				}

				return this._connect(result.hosts ? result : { hosts: result });
			});
		} else {
			this._connect({
				hosts: hosts,
				replacementHosts: options.replacementHosts
			});
		}
		let connected = 0;
		this.on('serverConnect', () => {
			connected++;
			if (connected === this.hosts.length) this.emit('ready');
		});
		this.keys('RDN_*')
			.then(keys => {
				for (const key of keys) this.tables.add(/^RDN_([^_]+)_/.exec(key)[1]);
			})
			.catch(err => this.emit('error', err));
	}

	/* Nextra Methods */

	// Virtual Tables

	table(key) {
		const that = this;
		key = key.replace(/\*|_/g, '');
		return new Proxy(() => {
			// noop
		}, {
			get(target, method) {
				return new Proxy(() => {
					// noop
				}, {
					async apply(tgt, _b, [record, ...args]) {
						if (!that.ready) throw new Error('Redis not yet ready');
						if (!that.tables.has(key)) throw new Error('Table does not exist');
						if (!that[method]) throw new Error('Invalid Redis Call');
						return that[method](`RDN_${key}_${record}`, ...args);
					}
				});
			}
		});
	}

	createTable(key) {
		key = key.replace(/\*|_/g, '');
		return this.tables.add(key);
	}

	async deleteTable(key) {
		key = key.replace(/\*|_/g, '');
		if (!this.tables.has(key)) throw 'There is no such table.';
		const keys = await this.sendCommand('KEYS', `RDN_${key}_*`);
		await Promise.all(keys.map(ky => this.del(ky)));
		return this.tables.delete(key);
	}

	// Extra Methods

	setJson(key, data, ttl) {
		if (ttl) return this.sendCommand('PSETEX', key, ttl, JSON.stringify(data));
		return this.sendCommand('SET', key, JSON.stringify(data));
	}

	async getJson(key) {
		const data = await this.sendCommand('GET', key);
		return JSON.parse(data);
	}

	async mgetJson(...keys) {
		const data = await this.sendCommand('MGET', ...keys);
		return data.map(datum => JSON.parse(datum));
	}

	async has(key) {
		return Boolean(await this.sendCommand('EXISTS', key));
	}

	values(key) {
		return this.sendCommand('KEYS', key).then(keys => this.sendCommand('MGET', ...keys)).catch(() => []);
	}

	valuesJson(key) {
		return this.sendCommand('KEYS', key).then(keys => this.mgetJson(...keys)).catch(() => []);
	}

	/* End Nextra Methods */

	sendCommand(cmd, ...args) {
		return new Promise((resolve, reject) => {
			const command = commands[cmd];

			if (this.ended) { return reject(new Error('Client has been ended.')); }

			if (this.offlineQueue) { return this.offlineQueue.push(cmd, args, { resolve, reject }); }

			if (args.length === 1 && Array.isArray(args[0])) { [args] = args; }

			if (command && command.supported !== false) {
				if (command.router) { return command.router(this, args, { resolve, reject }); }

				if (this.ring.members.length === 1) { return this.sendToServer(this.serverNameForKey(this.ring.members[0].key), cmd, args, { resolve, reject }); }

				if (typeof command.key !== 'undefined') { return this.sendToServer(this.serverNameForKey(args[command.key]), cmd, args, { resolve, reject }); }
			}

			return reject(new Error(`Command not supported: ${cmd}`));
		});
	}

	serverNameForKey(key) {
		key = String(key);

		for (let i = 0; i < key.length; i++) {
			if (key.charAt(i) === '{') {
				for (let j = i + 1; j < key.length; j++) {
					if (key.charAt(j) === '}') {
						key = key.substring(i + 1, j);
						break;
					}
				}

				break;
			}
		}

		return this.ring.getCached(key);
	}

	sendToServer(name, cmd, args, next) {
		const server = this.servers[name];

		if (!server) { return next.reject(new Error('Unable to acquire any server connections.')); }

		return server.sendCommand(cmd, args, next);
	}

	getServers(name) {
		return this.servers[name];
	}

	createScript(lua) {
		return new Script(this, lua);
	}

	end() {
		for (const server of Object.values(this.servers)) server.end();

		if (this.offlineQueue) {
			this.offlineQueue.flush('Client ended');
			delete this.offlineQueue;
		}

		this.ended = true;
		this.emit('end');
	}

	_connect(hostconfig) {
		this.discovering = false;

		this.hosts = conparse(hostconfig.hosts).servers;
		this.replacementHosts = conparse(hostconfig.replacementHosts || []).servers;

		this.ring = consistent({ hash: 'murmurhash' });
		this._createServers();

		if (this.offlineQueue) {
			const offlineCommands = this.offlineQueue.drain();
			delete this.offlineQueue;

			for (const entry of offlineCommands) this.sendCommand(...entry);
		}
	}

	_makeError(status) {
		const err = new Error(status.message);
		err.code = status.code;
		err.key = status.key;
		return err;
	}

	_createServers() {
		this.servers = {};

		const addServer = (host, replacementOf) => {
			host.port = host.port || 6379;
			const server = this.servers[host.string] = new Server(host, this.serverOptions);

			server.on('remove', () => {
				delete this.servers[host.string];

				if (this.replacementHosts.length) {
					const nhost = this.replacementHosts.shift();
					addServer(nhost, host);
				} else {
					this.ring.remove(host.string);
				}

				if (!Object.keys(this.servers).length) { this.emit('error', this._makeError({ message: 'No server connections available.', code: 'NO_CONNECTIONS' })); }
			});

			server.on('connect', () => this.emit('serverConnect', server));
			server.on('reconnect', () => this.emit('serverReconnect', server));

			if (replacementOf) {
				this.ring.replace({ key: replacementOf.string }, { key: host.string, weight: host.weight });
			} else {
				this.ring.add({ key: host.string, weight: host.weight });
			}
		};

		for (const host of this.hosts) addServer(host);
	}

}

for (const [cmd, info] of Object.entries(commands)) {
	if (info.supported !== false) {
		// eslint-disable-next-line func-names
		Client.prototype[cmd.toLowerCase()] = function (...args) {
			return this.sendCommand(cmd, ...args);
		};
	}
}

module.exports = Client;
