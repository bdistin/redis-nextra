const crypto = require('crypto');

class Script {

	construtor(client, lua) {
		this.client = client;
		this.lua = lua;
		this.hash = crypto.createHash('sha1').update(lua).digest('hex');
	}

	async eval(keys, ...vals) {
		const args = [this.hash, keys.length].concat(keys).concat(vals);

		return this.client.sendCommand('EVALSHA', args)
			.catch(err => {
				if (err && /NOSCRIPT/.test(err.message)) {
					args[0] = this.lua;
					return this.client.sendCommand('EVAL', args);
				}
				throw err;
			});
	}

}

module.exports = Script;
