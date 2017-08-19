class OfflineQueue {

	constructor() {
		this.queue = [];
	}

	push(cmd, args, next) {
		this.queue.push(new Command(cmd, args, next));
	}

	drain() {
		var data = this.queue;
		this.queue = [];
		return data;
	}

	flush(err) {
		for (const entry in this.drain()) {
			entry.handler.reject(err);
		}
	}

}

class Command {

	constructor(cmd, args, handler) {
		this.cmd = cmd;
		this.args = args;
		this.handler = handler;
	}

	toArray() {
		return [this.cmd].concat(this.args).concat([this.handler]);
	}

}

module.exports = OfflineQueue;
