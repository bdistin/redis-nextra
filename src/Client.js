const EventEmitter = require('events');

const ServerManager = require('./ServerManager');
const commands = require('./commands');

class Client extends EventEmitter {

	constructor(hosts, options = {}) {
		super();
		this.ready = false;
		this.tables = new Set();
		this.servers = {};
		this.manager = new ServerManager(this, hosts, options);
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
		const keys = await this.manager.sendCommand('KEYS', `RDN_${key}_*`);
		await Promise.all(keys.map(ky => this.manager.sendCommand('DEL', ky)));
		return this.tables.delete(key);
	}

	// Extra Methods

	setJson(key, data, ttl) {
		if (ttl) return this.manager.sendCommand('PSETEX', key, ttl, JSON.stringify(data));
		return this.manager.sendCommand('SET', key, JSON.stringify(data));
	}

	async getJson(key) {
		const data = await this.manager.sendCommand('GET', key);
		return JSON.parse(data);
	}

	async mgetJson(...keys) {
		const data = await this.manager.sendCommand('MGET', ...keys);
		return data.map(datum => JSON.parse(datum));
	}

	async has(key) {
		return Boolean(await this.manager.sendCommand('EXISTS', key));
	}

	values(key) {
		return this.manager.sendCommand('KEYS', key).then(keys => this.manager.sendCommand('MGET', ...keys)).catch(() => []);
	}

	valuesJson(key) {
		return this.manager.sendCommand('KEYS', key).then(keys => this.mgetJson(...keys)).catch(() => []);
	}

	/* End Nextra Methods */

}

for (const [cmd, info] of Object.entries(commands)) {
	if (info.supported !== false) {
		// eslint-disable-next-line func-names
		Client.prototype[cmd.toLowerCase()] = function (...args) {
			return this.manager.sendCommand(cmd, ...args);
		};
	}
}

module.exports = Client;
