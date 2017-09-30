declare module 'redis-nextra' {

	import * as Consistent from 'consistent';
	import { Reader } from 'hiredis';

	export class Client extends NodeJS.EventEmitter {

		public ready: boolean;
		public tables: Set<string>;
		public servers: { [x: string]: Server };
		public manager: ServerManager;
		public constructor(hosts: string|Function, options?: ServerManagerOptions);

		public table(key: string): this;
		public createTable(key: string): Set<string>;
		public deleteTable(key: string): Promise<boolean>;

		public setJson(key: string, data: any, ttl?: number): Promise<any>;
		public getJson(key: string): Promise<any>;
		public mgetJson(...keys: any[]): Promise<any>;
		public has(key: string): Promise<boolean>;
		public values(key: string): Promise<any[]>;
		public valuesJson(key: string): Promise<any[]>;

	}

	export const commands: Commands;

	export class Connection extends NodeJS.EventEmitter {

		public client: Client;
		public host: Host;
		public retryDelay: number;
		public socketKeepAlive: boolean;
		public stream: NodeJS.Socket;
		public reader: Reader;
		public handlers: Array<ObjectPromise|Function>;
		public constructor(client: Client, host: Host, options?: ServerConnectionOptions);

		public write(cmd: string, pack: Buffer[]|string[], handler: ObjectPromise|Function): void;
		public end(): void;
		private _attachEvents(): void;
		private _connectionLost(): void;

	}

	export class OfflineQueue {

		public queue: Command[];
		public constructor();

		public push(cmd: string, args: any[], next: ObjectPromise): void;
		public drain(): Command[];
		public flush(err: any): void;

	}

	export class Command {

		public cmd: string;
		public args: any[];
		public handler: ObjectPromise;
		public constructor(cmd: string, args: any[], handler: ObjectPromise);

		public toArray(): any[];

	}

	export class Server {

		public client: Client;
		public host: Host;
		public connected: boolean;
		public weight: number;
		public removeTimeout: boolean;
		public connectionsPerServer: number;
		public enableOfflineQueue: boolean;
		public connectionOptions: ServerConnectionOptions;
		public offlineQueue?: OfflineQueue;
		public connections: Connection[];
		public constructor(client: Client, manager: ServerManager, host: Host);

		public sendCommand(cmd: string, args: any[], next: ObjectPromise): Promise<any>;
		public end(): void;
		private _createConnections(): Connection[];
		private _checkState(): void;

	}

	export class ServerManager {

		public client: Client;
		public serverOptions: ServerManagerOptions;
		public hosts: Host[];
		public replacementHosts: Host[];
		public ring: Consistent;
		public ended: boolean;
		public offlineQueue?: OfflineQueue;
		public constructor(client: Client, hosts: Function|string, options: ServerManagerOptions);

		public sendCommand(cmd: string, ...args: any[]): Promise<any>;
		public serverNameForKey(key: string): void;
		public sendToServer(name: string, cmd: string, args: any[], next: ObjectPromise): Promise<any>;
		public end(): void;
		public setup(password: string): void;
		public connect(hostconfig: { host: string, replacementHosts: any[] }): void;
		public makeError(status: Error): Error;
		public addServer(host: Host, replacementOf: Host): void;

	}

	export type ServerConnectionOptions = {
		socketNoDelay?: boolean;
		socketKeepAlive?: boolean;
		retryDelay?: number;
		host: Host;
	};

	export type ServerManagerOptions = {
		socketNoDelay?: boolean;
		socketKeepAlive?: boolean;
		removeTimeout?: boolean;
		retryDelay?: number;
		connectionsPerServer?: number;
		enableOfflineQueue?: boolean;
	};

	export type Host = {
		host: string;
		port: number;
		string: string;
		weight: number;
	};

	export type Commands = {
		APPEND: { key: 0 };
		AUTH: CommandRouterFunction;
		BGREWRITEAOF: CommandRouterFunction;
		BGSAVE: CommandRouterFunction;
		BITCOUNT: { key: 0 };
		BITOP: CommandRouterFunction;
		BITPOS: { key: 0 };
		BLPOP: { supported: false };
		BRPOP: { supported: false };
		BRPOPLPUSH: { supported: false };
		'CLIENT KILL': CommandRouterFunction;
		'CLIENT LIST': { supported: false };
		'CLIENT GETNAME': { supported: false };
		'CLIENT PAUSE': { supported: false };
		'CLIENT SETNAME': { supported: false };
		'CLUSTER SLOTS': { supported: false };
		COMMAND: { supported: false };
		'COMMAND COUNT': { supported: false };
		'COMMAND GETKEYS': { supported: false };
		'COMMAND INFO': { supported: false };
		'CONFIG GET': { supported: false };
		'CONFIG REWRITE': { supported: false };
		'CONFIG SET': { supported: false };
		'CONFIG RESETSTAT': { supported: false };
		DBSIZE: CommandRouterFunction;
		DEBUG: { supported: false };
		DECR: { key: 0 };
		DECRBY: { key: 0 };
		DEL: CommandRouterFunction;
		DISCARD: { supported: false };
		DUMP: { key: 0 };
		ECHO: { duplicate: true, nokeys: true };
		EVAL: CommandRouterFunction;
		EVALSHA: CommandRouterFunction;
		EXEC: { duplicate: true, nokeys: true };
		EXISTS: { key: 0 };
		EXPIRE: { key: 0 };
		EXPIREAT: { key: 0 };
		FLUSHALL: { duplicate: true, nokeys: true };
		FLUSHDB: { duplicate: true, nokeys: true };
		GET: { key: 0 };
		GETBIT: { key: 0 };
		GETRANGE: { key: 0 };
		GETSET: { key: 0 };
		HDEL: { key: 0 };
		HEXISTS: { key: 0 };
		HGET: { key: 0 };
		HGETALL: { key: 0 };
		HINCRBY: { key: 0 };
		HINCRBYFLOAT: { key: 0 };
		HKEYS: { key: 0 };
		HLEN: { key: 0 };
		HMGET: { key: 0 };
		HMSET: { key: 0 };
		HSET: { key: 0 };
		HSETNX: { key: 0 };
		HVALS: { key: 0 };
		INCR: { key: 0 };
		INCRBY: { key: 0 };
		INCRBYFLOAT: { key: 0 };
		INFO: CommandRouterFunction;
		KEYS: { key: 0 };
		LASTSAVE: { key: 0 };
		LINDEX: { key: 0 };
		LINSERT: { key: 0 };
		LLEN: { key: 0 };
		LPOP: { key: 0 };
		LPUSH: { key: 0 };
		LPUSHX: { key: 0 };
		LRANGE: { key: 0 };
		LREM: { key: 0 };
		LSET: { key: 0 };
		LTRIM: { key: 0 };
		MGET: CommandRouterFunction;
		MIGRATE: { key: 2 };
		MONITOR: { supported: false };
		MOVE: { key: 0 };
		MSET: { supported: false };
		MSETNX: { supported: false };
		MULTI: { supported: false };
		OBJECT: { supported: false };
		PERSIST: { key: 0 };
		PEXPIRE: { key: 0 };
		PEXPIREAT: { key: 0 };
		PFADD: { key: 0 };
		PFCOUNT: CommandRouterFunction;
		PFMERGE: CommandRouterFunction;
		PING: CommandRouterFunction;
		PSETEX: { key: 0 };
		PSUBSCRIBE: { supported: false };
		PUBSUB: { supported: false };
		PTTL: { key: 0 };
		PUBLISH: { supported: false };
		PUNSUBSCRIBE: { supported: false };
		QUIT: CommandRouterFunction;
		RANDOMKEY: CommandRouterFunction;
		RENAME: CommandRouterFunction;
		RENAMENX: CommandRouterFunction;
		RESTORE: { key: 0 };
		ROLE: CommandRouterFunction;
		RPOP: { key: 0 };
		RPOPLPUSH: CommandRouterFunction;
		RPUSH: { key: 0 };
		RPUSHX: { key: 0 };
		SADD: { key: 0 };
		SAVE: CommandRouterFunction;
		SCARD: { key: 0 };
		SCRIPT: CommandRouterFunction;
		SDIFF: CommandRouterFunction;
		SDIFFSTORE: CommandRouterFunction;
		SELECT: CommandRouterFunction;
		SET: { key: 0 };
		SETBIT: { key: 0 };
		SETEX: { key: 0 };
		SETNX: { key: 0 };
		SETRANGE: { key: 0 };
		SHUTDOWN: CommandRouterFunction;
		SINTER: CommandRouterFunction;
		SINTERSTORE: CommandRouterFunction;
		SISMEMBER: { key: 0 };
		SLAVEOF: { supported: false };
		SLOWLOG: { supported: false };
		SMEMBERS: { key: 0 };
		SMOVE: CommandRouterFunction;
		SORT: { key: 0 };
		SPOP: { key: 0 };
		SRANDMEMBER: { key: 0 };
		SREM: { key: 0 };
		STRLEN: { key: 0 };
		SUBSCRIBE: { supported: false };
		SUNION: CommandRouterFunction;
		SUNIONSTORE: CommandRouterFunction;
		SYNC: { supported: false };
		TIME: CommandRouterFunction;
		TTL: { key: 0 };
		TYPE: { key: 0 };
		UNSUBSCRIBE: { supported: false };
		UNWATCH: { supported: false };
		WATCH: { supported: false };
		ZADD: { key: 0 };
		ZCARD: { key: 0 };
		ZCOUNT: { key: 0 };
		ZINCRBY: { key: 0 };
		ZINTERSTORE: CommandRouterFunction;
		ZLEXCOUNT: { key: 0 };
		ZRANGE: { key: 0 };
		ZRANGEBYLEX: { key: 0 };
		ZREVRANGEBYLEX: { key: 0 };
		ZRANGEBYSCORE: { key: 0 };
		ZRANK: { key: 0 };
		ZREM: { key: 0 };
		ZREMRANGEBYLEX: { key: 0 };
		ZREMRANGEBYRANK: { key: 0 };
		ZREMRANGEBYSCORE: { key: 0 };
		ZREVRANGE: { key: 0 };
		ZREVRANGEBYSCORE: { key: 0 };
		ZREVRANK: { key: 0 };
		ZSCORE: { key: 0 };
		ZUNIONSTORE: CommandRouterFunction;
		SCAN: { supported: false };
		SSCAN: { key: 0 };
		HSCAN: { key: 0 };
		ZSCAN: { key: 0 };
	};

	export type CommandRouterFunction = {
		router: (client: Client, args: any, next: ObjectPromise) => Promise<any>;
	};

	export type ObjectPromise = {
		resolve: any;
		reject: any;
	};

}
