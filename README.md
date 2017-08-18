## Redis-Nextra

[![npm](https://nodei.co/npm/redis-nextra.png?downloads=true&stars=true)](https://nodei.co/npm/redis-nextra/)

[![npm](https://img.shields.io/npm/v/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)
[![npm](https://img.shields.io/npm/dt/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)

Node.js V8 native fs, enhanced with util.promisify and standard extra methods. Written in full ES2017, sans every sync method. *Async is the future!*

## Usage

```javascript
// First, we require redis-nextra.
const Redis = require('redis-nextra');

// As redis-nextra extends redis.RedisClient, you create the instance in the
// following way, options are the same.
const redis = new Redis({});

// Make sure to listen the events from redis.
redis
	.on("connect", () => console.log('Redis Connected'))
	.on("reconnect", () => console.warn('Redis is reconnecting'))
	.on("error", err => console.error('Redis error:', err));

// As in virtual tables, tables.has is sync as it checks a value from a Set.
// And redis.createTable only adds a new value to said Set.
if (!redis.tables.has('users')) redis.createTable('users');

// Check if the key 'Sandra' exists in the virtual table 'users'.
// If it exists, return true, otherwise set it.
redis.table('users').has('Sandra')
    .then(exists => exists ? true : redis.table('users').set('Sandra', { age: 21 }));

// The example above is equal to:
redis.hasAsync('RDN_users_Sandra')
    .then(exists => exists ? true : redis.setAsync('RDN_users_Sandra', JSON.stringify({ age: 21 })));

// redis.hasAsync is a method from redis-nextra which calls redis.exists and
// returns a Boolean.
```

## Docs

All methods from `redis.RedisClient`'s prototype are promisified with `Async` appended at the end of the name, it means, when using redis-nextra, you might want to use `redis.prototype.getAsync` instead of `redis.prototype.get`, as the first one is the promisified method and will return a [Native Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).

Additionally, this package does use of [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy) when using `redis.prototype.table`, which is an object oriented way to use it, for example:

Normally, with [Redis](https://github.com/NodeRedis/node_redis) you would use the following code:

```javascript
redis.psetex('RDN_someTable_someEntry', 10000, JSON.stringify(someObject));
```

However, with Redis-Nextra and using the `redis.prototype.table`'s proxy:

```javascript
redis.table(someTable).set(someEntry, someObject, 10000);
```

Additionally, this package uses **virtual tables** stored in `redis.prototype.tables` as a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) and uses [JSON.parse()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) internally so you are able to store objects without having to worry, these methods are only applied to the methods with `Async` appended at the end of the method's name, normal ones will work as expected from the [Redis.io documentation](https://redis.io/commands), also check the Redis driver for Node.js documentation [here](http://redis.js.org/).

## License

Copyright (c) 2017 [BDISTIN](https://github.com/bdistin)
