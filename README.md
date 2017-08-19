## Redis-Nextra

[![npm](https://nodei.co/npm/redis-nextra.png?downloads=true&stars=true)](https://nodei.co/npm/redis-nextra/)

[![npm](https://img.shields.io/npm/v/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)
[![npm](https://img.shields.io/npm/dt/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)

Node.js V8 redis, enhanced with native promises and extra functionality. Written in full ES2017. *Async is the future!*

## Usage

```javascript
// First, we require redis-nextra.
const Redis = require('redis-nextra');

// Create a connection to redis with a string
const redis = new Redis.Client('host:port', options); // or just 'host' if the port is the defualt port
// As an array of strings, to evenly load the servers
const redis = new Redis.Client(['host1:port', 'host2'], options);
// As an object to custom weight different servers
const redis = new Redis.Client({ "host1:port": 1, host2: 2 }, options); // host 2 will take on 2x the load that host 1 will

// Make sure to listen the events from redis.
redis
	.on('reconnect', () => console.warn('Redis is reconnecting'))
	.on('error', err => console.error('Redis error:', err));

// As in virtual tables, tables.has is sync as it checks a value from a Set.
// And redis.createTable only adds a new value to said Set.
if (!redis.tables.has('users')) redis.createTable('users');

// Check if the key 'Sandra' exists in the virtual table 'users'.
// If it exists, return true, otherwise set it.
redis.table('users').has('Sandra')
    .then(exists => exists ? true : redis.table('users').setJson('Sandra', { age: 21 }));

// The example above is equal to:
redis.has('RDN_users_Sandra')
    .then(exists => exists ? true : redis.set('RDN_users_Sandra', JSON.stringify({ age: 21 })));

// redis.has is a method from redis-nextra which calls redis.exists and
// returns a Boolean.
```

## Docs

All methods return [Native Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).

Additionally, this package does use of [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy) when using `redis.prototype.table`, which is an object oriented way to use it, for example:

Normally, with [Redis](https://github.com/NodeRedis/node_redis) you would use the following code:

```javascript
redis.psetex('RDN_someTable_someEntry', 10000, JSON.stringify(someObject));
```

However, with Redis-Nextra and using the `redis.prototype.table`'s proxy:

```javascript
redis.table(someTable).setJson(someEntry, someObject, 10000);
```

Additionally, this package uses **virtual tables** stored in `redis.prototype.tables` as a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) and uses [JSON.parse()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) internally on all methods with the Json suffix, normal methods will work as expected from the [Redis.io documentation](https://redis.io/commands).

## License

Copyright (c) 2017 [BDISTIN](https://github.com/bdistin)
