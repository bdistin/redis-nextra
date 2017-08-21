const consistent = require('consistent');
const conparse = require('connection-parse');

const OfflineQueue = require('./OfflineQueue');
const Server = require('./Server');
const commands = require('./commands');


class ServerManager {

	constructor(client, hosts, options) {
		this.client = client;
		this.serverOptions = {
			socketNoDelay: options.socketNoDelay,
			socketKeepAlive: options.socketKeepAlive,
			removeTimeout: options.removeTimeout,
			retryDelay: options.retryDelay,
			connectionsPerServer: options.connectionsPerServer,
			enableOfflineQueue: options.enableOfflineQueue
		};
		this.hosts = [];
		this.replacementHosts = [];
		this.ring = null;
		this.ended = false;
		if (typeof hosts === 'function') {
			this.offlineQueue = new OfflineQueue();

			hosts((err, result) => {
				if (err) {
					this.client.emit('error', this.makeError({ message: `Discovery failed: ${err.message}`, code: 'DISCOVERY_FAILED' }));
					return this.end();
				}

				return this.connect(result.hosts ? result : { hosts: result });
			});
		} else {
			this.connect({
				hosts: hosts,
				replacementHosts: options.replacementHosts
			});
		}
		this.setup(options.password);
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
		const server = this.client.servers[name];

		if (!server) { return next.reject(new Error('Unable to acquire any server connections.')); }

		return server.sendCommand(cmd, args, next);
	}

	end() {
		for (const server of Object.values(this.client.servers)) server.end();

		if (this.offlineQueue) {
			this.offlineQueue.flush('Client ended');
			delete this.offlineQueue;
		}

		this.ended = true;
		this.client.emit('end');
	}

	setup(password) {
		let connected = 0;
		const connectCounter = server => {
			if (server.offlineQueue) for (const entry of server.offlineQueue.drain()) server.sendCommand(entry.cmd, entry.args, entry.handler);
			connected++;
			if (connected === this.hosts.length) this.client.emit('ready');
		};
		this.client.on('serverConnect', connectCounter);
		this.client.once('ready', () => {
			this.client.removeListener('serverConnect', connectCounter);
			this.client.ready = true;
		});
		this.client.on('serverRemove', server => {
			delete this.client.servers[server.host.string];

			if (this.replacementHosts.length) {
				const nhost = this.replacementHosts.shift();
				this.addServer(nhost, server.host);
			} else {
				this.ring.remove(server.host.string);
			}

			if (!Object.keys(this.client.servers).length) { this.client.emit('error', this.makeError({ message: 'No server connections available.', code: 'NO_CONNECTIONS' })); }
		});
		if (password) this.sendCommand('AUTH', password);
		this.sendCommand('KEYS', 'RDN_*')
			.then(keys => {
				for (const key of keys) this.client.tables.add(/^RDN_([^_]+)_/.exec(key)[1]);
			})
			.catch(err => this.client.emit('error', err));
	}

	connect(hostconfig) {
		this.discovering = false;

		this.hosts.push(...conparse(hostconfig.hosts).servers);
		this.replacementHosts.push(...conparse(hostconfig.replacementHosts || []).servers);

		this.ring = consistent({ hash: 'murmurhash' });

		for (const host of this.hosts) this.addServer(host);

		if (this.offlineQueue) {
			const offlineCommands = this.offlineQueue.drain();
			delete this.offlineQueue;

			for (const entry of offlineCommands) this.sendCommand(...entry);
		}
	}

	makeError(status) {
		const err = new Error(status.message);
		err.code = status.code;
		err.key = status.key;
		return err;
	}

	addServer(host, replacementOf) {
		host.port = host.port || 6379;
		this.client.servers[host.string] = new Server(this.client, this, host);
		if (replacementOf) this.ring.replace({ key: replacementOf.string }, { key: host.string, weight: host.weight });
		else this.ring.add({ key: host.string, weight: host.weight });
	}

}

module.exports = ServerManager;
