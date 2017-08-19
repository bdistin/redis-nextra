/* eslint-disable func-names */
module.exports = {
	APPEND: { key: 0 },
	AUTH: {
		router: function (client, args, next) {
			fanoutOperation(client, 'AUTH', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	BGREWRITEAOF: {
		router: function (client, args, next) {
			fanoutOperation(client, 'BGREWRITEAOF', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	BGSAVE: {
		router: function (client, args, next) {
			fanoutOperation(client, 'BGSAVE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	BITCOUNT: { key: 0 },
	BITOP: {
		router: function (client, args, next) {
			singleServerOperation(client, 'BITOP', args, args.slice(1))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	BITPOS: { key: 0 },
	BLPOP: { supported: false },
	BRPOP: { supported: false },
	BRPOPLPUSH: { supported: false },
	'CLIENT KILL': {
		router: function (client, args, next) {
			fanoutOperation(client, 'CLIENT KILL', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	'CLIENT LIST': { supported: false },
	'CLIENT GETNAME': { supported: false },
	'CLIENT PAUSE': { supported: false },
	'CLIENT SETNAME': { supported: false },
	'CLUSTER SLOTS': { supported: false },
	COMMAND: { supported: false },
	'COMMAND COUNT': { supported: false },
	'COMMAND GETKEYS': { supported: false },
	'COMMAND INFO': { supported: false },
	'CONFIG GET': { supported: false },
	'CONFIG REWRITE': { supported: false },
	'CONFIG SET': { supported: false },
	'CONFIG RESETSTAT': { supported: false },
	DBSIZE: {
		router: function (client, args, next) {
			fanoutOperation(client, 'DBSIZE', args)
				.then(data => next.resolve(data.reduce((ma, ca) => ma + ca, 0)))
				.catch(err => next.reject(err));
		}
	},
	DEBUG: { supported: false },
	DECR: { key: 0 },
	DECRBY: { key: 0 },
	DEL: {
		router: function (client, args, next) {
			groupOperation(client, 'DEL', args)
				.then(data => {
					const sum = Object.values(data).reduce((a, b) => a + b.result, 0);
					return next.resolve(sum);
				})
				.catch(err => next.reject(err));
		}
	},
	DISCARD: { supported: false },
	DUMP: { key: 0 },
	ECHO: {
		duplicate: true,
		nokeys: true
	},
	EVAL: {
		router: function (client, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (!numkeys) { return next.reject(new Error('EVAL command without any keys are is supported.')); }

			return singleServerOperation(client, 'EVAL', args, args.slice(2, 2 + numkeys))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	EVALSHA: {
		router: function (client, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (!numkeys) { return next.reject(new Error('EVALSHA command without any keys are is supported.')); }

			return singleServerOperation(client, 'EVALSHA', args, args.slice(2, 2 + numkeys))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	EXEC: {
		duplicate: true,
		nokeys: true
	},
	EXISTS: { key: 0 },
	EXPIRE: { key: 0 },
	EXPIREAT: { key: 0 },
	FLUSHALL: {
		duplicate: true,
		nokeys: true
	},
	FLUSHDB: {
		duplicate: true,
		nokeys: true
	},
	GET: { key: 0 },
	GETBIT: { key: 0 },
	GETRANGE: { key: 0 },
	GETSET: { key: 0 },
	HDEL: { key: 0 },
	HEXISTS: { key: 0 },
	HGET: { key: 0 },
	HGETALL: { key: 0 },
	HINCRBY: { key: 0 },
	HINCRBYFLOAT: { key: 0 },
	HKEYS: { key: 0 },
	HLEN: { key: 0 },
	HMGET: { key: 0 },
	HMSET: { key: 0 },
	HSET: { key: 0 },
	HSETNX: { key: 0 },
	HVALS: { key: 0 },
	INCR: { key: 0 },
	INCRBY: { key: 0 },
	INCRBYFLOAT: { key: 0 },
	INFO: {
		router: function (client, args, next) {
			fanoutOperation(client, 'INFO', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	KEYS: { key: 0 },
	LASTSAVE: { key: 0 },
	LINDEX: { key: 0 },
	LINSERT: { key: 0 },
	LLEN: { key: 0 },
	LPOP: { key: 0 },
	LPUSH: { key: 0 },
	LPUSHX: { key: 0 },
	LRANGE: { key: 0 },
	LREM: { key: 0 },
	LSET: { key: 0 },
	LTRIM: { key: 0 },
	MGET: {
		router: function (client, args, next) {
			groupOperation(client, 'MGET', args)
				.then(data => {
					const result = [];
					for (const res of Object.values(data)) {
						for (let i = 0; i < res.result.length; i++) {
							result[res.indexes[i]] = res.result[i];
						}
					}

					return next.resolve(result);
				})
				.catch(err => next.reject(err));
		}
	},
	MIGRATE: { key: 2 },
	MONITOR: { supported: false },
	MOVE: { key: 0 },
	MSET: { supported: false },
	MSETNX: { supported: false },
	MULTI: { supported: false },
	OBJECT: { supported: false },
	PERSIST: { key: 0 },
	PEXPIRE: { key: 0 },
	PEXPIREAT: { key: 0 },
	PFADD: { key: 0 },
	PFCOUNT: {
		router: function (client, args, next) {
			groupOperation(client, 'PFCOUNT', args)
				.then(data => {
					const sum = Object.values(data).reduce((a, b) => a + b.result, 0);
					return next.resolve(sum);
				})
				.catch(err => next.reject(err));
		}
	},
	PFMERGE: {
		router: function (client, args, next) {
			singleServerOperation(client, 'PFMERGE', args, next)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	PING: {
		router: function (client, args, next) {
			fanoutOperation(client, 'PING', args)
				.then(() => next.resolve('PONG'))
				.catch(err => next.reject(err));
		}
	},
	PSETEX: { key: 0 },
	PSUBSCRIBE: { supported: false },
	PUBSUB: { supported: false },
	PTTL: { key: 0 },
	PUBLISH: { supported: false },
	PUNSUBSCRIBE: { supported: false },
	QUIT: {
		router: function (client, args, next) {
			client.end();
			next.resolve();
		}
	},
	RANDOMKEY: {
		router: function (client, args, next) {
			const servers = Object.keys(client.servers);
			const sel = servers[Math.floor(Math.random() * servers.length)];

			client.sendToServer(sel, 'RANDOMKEY', args, next);
		}
	},
	RENAME: {
		router: function (client, args, next) {
			singleServerOperation(client, 'RENAME', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	RENAMENX: {
		router: function (client, args, next) {
			singleServerOperation(client, 'RENAMENX', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	RESTORE: { key: 0 },
	ROLE: {
		router: function (client, args, next) {
			fanoutOperation(client, 'ROLE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	RPOP: { key: 0 },
	RPOPLPUSH: {
		router: function (client, args, next) {
			singleServerOperation(client, 'RPOPLPUSH', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	RPUSH: { key: 0 },
	RPUSHX: { key: 0 },
	SADD: { key: 0 },
	SAVE: {
		router: function (client, args, next) {
			fanoutOperation(client, 'SAVE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SCARD: { key: 0 },
	SCRIPT: {
		router: function (client, args, next) {
			fanoutOperation(client, 'SCRIPT', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SDIFF: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SDIFF', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SDIFFSTORE: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SDIFFSTORE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SELECT: {
		router: function (client, args, next) {
			fanoutOperation(client, 'SELECT', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SET: { key: 0 },
	SETBIT: { key: 0 },
	SETEX: { key: 0 },
	SETNX: { key: 0 },
	SETRANGE: { key: 0 },
	SHUTDOWN: {
		router: function (client, args, next) {
			fanoutOperation(client, 'SHUTDOWN', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SINTER: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SINTER', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SINTERSTORE: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SINTERSTORE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SISMEMBER: { key: 0 },
	SLAVEOF: { supported: false },
	SLOWLOG: { supported: false },
	SMEMBERS: { key: 0 },
	SMOVE: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SMOVE', args, args.slice(0, args.length - 1))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SORT: { key: 0 },
	SPOP: { key: 0 },
	SRANDMEMBER: { key: 0 },
	SREM: { key: 0 },
	STRLEN: { key: 0 },
	SUBSCRIBE: { supported: false },
	SUNION: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SUNION', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SUNIONSTORE: {
		router: function (client, args, next) {
			singleServerOperation(client, 'SUNIONSTORE', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SYNC: { supported: false },
	TIME: {
		router: function (client, args, next) {
			fanoutOperation(client, 'TIME', args)
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	TTL: { key: 0 },
	TYPE: { key: 0 },
	UNSUBSCRIBE: { supported: false },
	UNWATCH: { supported: false },
	WATCH: { supported: false },
	ZADD: { key: 0 },
	ZCARD: { key: 0 },
	ZCOUNT: { key: 0 },
	ZINCRBY: { key: 0 },
	ZINTERSTORE: {
		router: function (client, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (isNaN(numkeys) || numkeys <= 0) { return next.reject(new Error('Invalid arguments')); }

			return singleServerOperation(client, 'ZINTERSTORE', args, [args[0]].concat(args.slice(2, numkeys + 2)))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	ZLEXCOUNT: { key: 0 },
	ZRANGE: { key: 0 },
	ZRANGEBYLEX: { key: 0 },
	ZREVRANGEBYLEX: { key: 0 },
	ZRANGEBYSCORE: { key: 0 },
	ZRANK: { key: 0 },
	ZREM: { key: 0 },
	ZREMRANGEBYLEX: { key: 0 },
	ZREMRANGEBYRANK: { key: 0 },
	ZREMRANGEBYSCORE: { key: 0 },
	ZREVRANGE: { key: 0 },
	ZREVRANGEBYSCORE: { key: 0 },
	ZREVRANK: { key: 0 },
	ZSCORE: { key: 0 },
	ZUNIONSTORE: {
		router: function (client, args, next) {
			const numkeys = parseInt(args[1], 0);

			if (isNaN(numkeys) || numkeys <= 0) { return next.reject(new Error('Invalid arguments')); }

			return singleServerOperation(client, 'ZUNIONSTORE', args, [args[0]].concat(args.slice(2, numkeys + 2)))
				.then(data => next.resolve(data))
				.catch(err => next.reject(err));
		}
	},
	SCAN: {
		// can be...
		supported: false
	},
	SSCAN: { key: 0 },
	HSCAN: { key: 0 },
	ZSCAN: { key: 0 }
};

/* eslint-enable func-names */

function singleServerOperation(client, cmd, args, keys) {
	return new Promise((resole, reject) => {
		if (!keys.length) { return reject(new Error('Invalid arguments')); }

		let server;

		for (let i = 0; i < keys.length; i++) {
			const as = client.serverNameForKey(keys[i]);
			if (!server) server = as;
			if (server !== as) return reject(new Error(`Keys are mapped to different hash slots for command ${cmd}`));
		}

		return client.sendToServer(server, client, args, { resole, reject });
	});
}

function fanoutOperation(client, cmd, args) {
	return Promise.all(Object.keys(client.servers).map(server => new Promise((resolve, reject) => client.sendToServer(server, cmd, args, { resolve, reject }))));
}

function groupOperation(client, cmd, args) {
	return new Promise((resolve, reject) => {
		if (!args.length) { return reject(new Error('Invalid arguments')); }

		if (args.length === 1) { return client.sendToServer(client.serverNameForKey(args[0]), cmd, args, { resolve, reject }); }

		const groups = {};

		for (let i = 0; i < args.length; i++) {
			const server = client.serverNameForKey(args[i]);
			groups[server] = groups[server] || { args: [], indexes: [] };
			groups[server].args.push(args[i]);
			groups[server].indexes.push(i);
		}

		const servers = Object.keys(groups);

		Promise.all(servers.map(server => new Promise((res, rej) => client.sendToServer(server, cmd, groups[server].args, { resolve: res, reject: rej }))))
			.then(results => {
				for (let i = 0; i < servers.length; i++) groups[servers[i]].result = results[i];
				return resolve(groups);
			})
			.catch(err => reject(err));
	});
}
