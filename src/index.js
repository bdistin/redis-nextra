const redis = require('redis');
const unifyClient = require('redis/lib/createClient');
const { promisify } = require('util');

const methods = new Set();

for (const [key, method] of Object.entries(redis.RedisClient.prototype)) {
	if (typeof method === 'function') {
		redis.RedisClient.prototype[`${key}Async`] = promisify(method);
		methods.add(key);
	}
}

class RedisNextraClient extends redis.RedisClient {

	constructor(...args) {
		super(unifyClient(...args));
		this.tables = new Set();
		this.keys('RDN_*', (err, keys) => {
			if (err) this.client.emit('error', err);
			for (const key of keys) this.tables.add(/^RDN_([^_]+)_/.exec(key)[1]);
		});
	}

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
						if (!methods.has(method)) throw new Error('Invalid Redis Call');
						return that[`${method}Async`](`RDN_${key}_${record}`, ...args);
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
		const keys = await this.keysAsync(`RDN_${key}_*`);
		await Promise.all(keys.map(ky => this.deleteAsync(ky)));
		return this.tables.delete(key);
	}

}

module.exports = RedisNextraClient;
