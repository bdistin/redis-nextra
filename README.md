## Redis-Nextra

[![npm](https://nodei.co/npm/redis-nextra.png?downloads=true&stars=true)](https://nodei.co/npm/redis-nextra/)

[![npm](https://img.shields.io/npm/v/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)
[![npm](https://img.shields.io/npm/dt/redis-nextra.svg?maxAge=3600)](https://www.npmjs.com/package/redis-nextra)

Node.js V8 native fs, enhanced with util.promisify and standard extra methods. Written in full ES2017, sans every sync method. *Async is the future!*

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
