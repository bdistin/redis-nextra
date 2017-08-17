const redis = require('redis');
const unifyClient = require('redis/lib/createClient');
const { promisify } = require('util');

for (const [key, method] of Object.entries(redis.RedisClient.prototype)) {
	if (typeof method === 'function') {
		redis.RedisClient.prototype[`${key}Async`] = promisify(method);
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
						if (!that[`${method}Async`]) throw new Error('Invalid Redis Call');
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
		await Promise.all(keys.map(ky => this.delAsync(ky)));
		return this.tables.delete(key);
	}

	setAsync(key, data, ttl) {
		if (ttl) return super.psetexAsync(key, ttl, JSON.stringify(data));
		return super.setAsync(key, JSON.stringify(data));
	}

	async getAsync(key) {
		return JSON.parse(await super.getAsync(key));
	}

	async hasAsync(key) {
		return !!await super.exists(key);
	}

}

module.exports = RedisNextraClient;
