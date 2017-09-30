const EventEmitter = require('events');

const ServerManager = require('./ServerManager');
const commands = require('./commands');

/**
 * @type {RedisClient}
 */
class Client extends EventEmitter {

	/**
	 * @param {string|Function} hosts The host/hosts to connect to.
	 * @param {ServerManagerOptions} options The options for the server manager.
	 */
	constructor(hosts, options = {}) {
		super();

		/**
		 * Whether Redis is ready or not
		 */
		this.ready = false;

		/**
		 * The virtual tables Redis-Nextra is handling
		 * @type {Set<string>}
		 */
		this.tables = new Set();

		/**
		 * @type {{ [x: string]: Server }}
		 */
		this.servers = {};

		/**
		 * @type {ServerManager}
		 */
		this.manager = new ServerManager(this, hosts, options);
	}

	/* Nextra Methods */

	// Virtual Tables

	/**
	 * Access to a virtual table from Redis-Nextra
	 * @param {string} key A virtual table name to operate with.
	 * @returns {this}
	 */
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

	/**
	 * Create a new virtual table.
	 * @param {string} key A virtual table name to create.
	 * @returns {Set<string>}
	 */
	createTable(key) {
		key = key.replace(/\*|_/g, '');
		return this.tables.add(key);
	}

	/**
	 * Delete a virtual table.
	 * @param {string} key A virtual table name to delete.
	 * @returns {Promise<boolean>}
	 */
	async deleteTable(key) {
		key = key.replace(/\*|_/g, '');
		if (!this.tables.has(key)) throw 'There is no such table.';
		const keys = await this.manager.sendCommand('KEYS', `RDN_${key}_*`);
		await Promise.all(keys.map(ky => this.manager.sendCommand('DEL', ky)));
		return this.tables.delete(key);
	}

	// Extra Methods

	/**
	 * Set stringified JSON data to a key.
	 * @param {string} key The key to set the data to.
	 * @param {any} data The JSON data to store.
	 * @param {number} [ttl] The time to live in milliseconds.
	 * @returns {Promise<any>}
	 */
	setJson(key, data, ttl) {
		if (ttl) return this.manager.sendCommand('PSETEX', key, ttl, JSON.stringify(data));
		return this.manager.sendCommand('SET', key, JSON.stringify(data));
	}

	/**
	 * Get a parsed JSON object from a key.
	 * @param {string} key The key to get the data from.
	 * @returns {Promise<any>}
	 */
	async getJson(key) {
		const data = await this.manager.sendCommand('GET', key);
		return JSON.parse(data);
	}

	/**
	 * Get an array of parsed JSON objects from multiples keys.
	 * @param {any[]} keys The keys to get.
	 * @returns {Promise<any[]>}
	 */
	async mgetJson(...keys) {
		const data = await this.manager.sendCommand('MGET', ...keys);
		return data.map(datum => JSON.parse(datum));
	}

	/**
	 * Check if a key exists in Redis.
	 * @param {string} key The key to check.
	 * @returns {Promise<boolean>}
	 */
	async has(key) {
		return Boolean(await this.manager.sendCommand('EXISTS', key));
	}

	/**
	 * Queries a KEYS command to Redis and execute a MGET with all the keys.
	 * @param {string} key The key value to get the data from.
	 * @returns {Promise<any[]>}
	 */
	values(key) {
		return this.manager.sendCommand('KEYS', key).then(keys => this.manager.sendCommand('MGET', ...keys)).catch(() => []);
	}

	/**
	 * Queries a KEYS command to Redis and execute a MGET with all the keys, parsing all them to JSON.
	 * @param {string} key The key value to get the data from.
	 * @returns {Promise<any[]>}
	 */
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
