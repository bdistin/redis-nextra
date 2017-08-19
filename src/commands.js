/* eslint-disable func-names */
module.exports = {
	APPEND: { key: 0 },
	AUTH: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'AUTH', args, next);
		}
	},
	BGREWRITEAOF: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'BGREWRITEAOF', args, next);
		}
	},
	BGSAVE: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'BGSAVE', args, next);
		}
	},
	BITCOUNT: { key: 0 },
	BITOP: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'BITOP', args, args.slice(1), next);
		}
	},
	BITPOS: { key: 0 },
	BLPOP: { supported: false },
	BRPOP: { supported: false },
	BRPOPLPUSH: { supported: false },
	'CLIENT KILL': {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'CLIENT KILL', args, next);
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
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'DBSIZE', args, (err, data) => {
				if (err) return next.reject(err);
				return next.resolve(data.reduce((ma, ca) => ma + ca, 0));
			});
		}
	},
	DEBUG: { supported: false },
	DECR: { key: 0 },
	DECRBY: { key: 0 },
	DEL: {
		router: function (cmd, args, next) {
			groupOperation(cmd, 'DEL', args, (err, data) => {
				if (err) return next.reject(err);
				const sum = Object.values(data).reduce((a, b) => a + b.result, 0);
				return next.resolve(sum);
			});
		}
	},
	DISCARD: { supported: false },
	DUMP: { key: 0 },
	ECHO: {
		duplicate: true,
		nokeys: true
	},
	EVAL: {
		router: function (cmd, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (!numkeys) { return next.reject(new Error('EVAL command without any keys are is supported.')); }

			return singleServerOperation(cmd, 'EVAL', args, args.slice(2, 2 + numkeys), next);
		}
	},
	EVALSHA: {
		router: function (cmd, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (!numkeys) { return next.reject(new Error('EVALSHA command without any keys are is supported.')); }

			return singleServerOperation(cmd, 'EVALSHA', args, args.slice(2, 2 + numkeys), next);
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
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'INFO', args, next);
		}
	},
	KEYS: {
		duplicate: true,
		nokeys: true
	},
	LASTSAVE: {
		duplicate: true,
		nokeys: true
	},
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
		router: function (cmd, args, next) {
			groupOperation(cmd, 'MGET', args, (err, data) => {
				if (err) return next.reject(err);
				const result = [];

				for (const res of Object.values(data)) {
					for (let i = 0; i < res.result.length; i++) {
						result[res.indexes[i]] = res.result[i];
					}
				}

				return next.resolve(result);
			});
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
		router: function (cmd, args, next) {
			groupOperation(cmd, 'PFCOUNT', args, (err, data) => {
				if (err) return next.reject(err);
				const sum = Object.values(data).reduce((a, b) => a + b.result, 0);
				return next.resolve(sum);
			});
		}
	},
	PFMERGE: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'PFMERGE', args, next);
		}
	},
	PING: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'PING', args, (err) => {
				if (err) return next.reject(err);
				return next.resolve('PONG');
			});
		}
	},
	PSETEX: { key: 0 },
	PSUBSCRIBE: { supported: false },
	PUBSUB: { supported: false },
	PTTL: { key: 0 },
	PUBLISH: { supported: false },
	PUNSUBSCRIBE: { supported: false },
	QUIT: {
		router: function (cmd, args, next) {
			cmd.end();
			next.resolve();
		}
	},
	RANDOMKEY: {
		router: function (cmd, args, next) {
			const servers = Object.keys(cmd.servers);
			const sel = servers[Math.floor(Math.random() * servers.length)];

			cmd.sendToServer(sel, 'RANDOMKEY', args, next);
		}
	},
	RENAME: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'RENAME', args, next);
		}
	},
	RENAMENX: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'RENAMENX', args, next);
		}
	},
	RESTORE: { key: 0 },
	ROLE: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'ROLE', args, next);
		}
	},
	RPOP: { key: 0 },
	RPOPLPUSH: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'RPOPLPUSH', args, next);
		}
	},
	RPUSH: { key: 0 },
	RPUSHX: { key: 0 },
	SADD: { key: 0 },
	SAVE: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'SAVE', args, next);
		}
	},
	SCARD: { key: 0 },
	SCRIPT: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'SCRIPT', args, next);
		}
	},
	SDIFF: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SDIFF', args, next);
		}
	},
	SDIFFSTORE: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SDIFFSTORE', args, next);
		}
	},
	SELECT: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'SELECT', args, next);
		}
	},
	SET: { key: 0 },
	SETBIT: { key: 0 },
	SETEX: { key: 0 },
	SETNX: { key: 0 },
	SETRANGE: { key: 0 },
	SHUTDOWN: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'SHUTDOWN', args, next);
		}
	},
	SINTER: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SINTER', args, next);
		}
	},
	SINTERSTORE: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SINTERSTORE', args, next);
		}
	},
	SISMEMBER: { key: 0 },
	SLAVEOF: { supported: false },
	SLOWLOG: { supported: false },
	SMEMBERS: { key: 0 },
	SMOVE: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SMOVE', args, args.slice(0, args.length - 1), next);
		}
	},
	SORT: { key: 0 },
	SPOP: { key: 0 },
	SRANDMEMBER: { key: 0 },
	SREM: { key: 0 },
	STRLEN: { key: 0 },
	SUBSCRIBE: { supported: false },
	SUNION: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SUNION', args, next);
		}
	},
	SUNIONSTORE: {
		router: function (cmd, args, next) {
			singleServerOperation(cmd, 'SUNIONSTORE', args, next);
		}
	},
	SYNC: { supported: false },
	TIME: {
		router: function (cmd, args, next) {
			fanoutOperation(cmd, 'TIME', args, next);
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
		router: function (cmd, args, next) {
			const numkeys = parseInt(args[1], 10);

			if (isNaN(numkeys) || numkeys <= 0) { return next.reject(new Error('Invalid arguments')); }

			return singleServerOperation(cmd, 'ZINTERSTORE', args, [args[0]].concat(args.slice(2, numkeys + 2)), next);
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
		router: function (cmd, args, next) {
			const numkeys = parseInt(args[1], 0);

			if (isNaN(numkeys) || numkeys <= 0) { return next.reject(new Error('Invalid arguments')); }

			return singleServerOperation(cmd, 'ZUNIONSTORE', args, [args[0]].concat(args.slice(2, numkeys + 2)), next);
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

function singleServerOperation(client, cmd, args, keys, next) {
	if (typeof keys === 'function') {
		next = keys;
		keys = args;
	}

	if (!keys.length) { return next.reject(new Error('Invalid arguments')); }

	let server;

	for (let i = 0; i < keys.length; i++) {
		const as = client.serverNameForKey(keys[i]);
		if (!server) server = as;
		if (server !== as) return next.reject(new Error(`Keys are mapped to different hash slots for command ${cmd}`));
	}

	return client.sendToServer(server, cmd, args, next);
}

function fanoutOperation(client, cmd, args, next) {
	const results = [];
	const servers = Object.keys(client.servers);
	let	ops = servers.length;

	for (const server of servers) {
		client.sendToServer(server, cmd, args, (err, data) => {
			if (err && ops >= 0) {
				ops = -1;
				return next.reject(err);
			}

			return results.push(data);
		});
	}
	return next.resolve(results);
}

function groupOperation(client, cmd, args, next) {
	if (!args.length) { return next.reject(new Error('Invalid arguments')); }

	if (args.length === 1) { return client.sendToServer(client.serverNameForKey(args[0]), cmd, args, next); }

	const groups = {};

	for (let i = 0; i < args.length; i++) {
		const server = client.serverNameForKey(args[i]);
		groups[server] = groups[server] || { args: [], indexes: [] };
		groups[server].args.push(args[i]);
		groups[server].indexes.push(i);
	}

	const servers = Object.keys(groups);
	let ops = servers.length;

	for (const server of servers) {
		client.sendToServer(server, cmd, groups[server].args, (err, data) => {
			if (err && ops >= 0) {
				ops = -1;
				return next.reject(err);
			}
			groups[server].result = data;
			return null;
		});
	}
	return next.resolve(groups);
}
