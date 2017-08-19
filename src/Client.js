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
	}

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
