class OfflineQueue {

	constructor() {
		/**
		 * @type {Command[]}
		 */
		this.queue = [];
	}

	/**
	 * Push a new command to the offline queue.
	 * @param {string} cmd The command name to execute.
	 * @param {any[]} args The arguments for the command to execute.
	 * @param {Object} next The Resolve and Reject references for the promise.
	 * @returns {void}
	 */
	push(cmd, args, next) {
		this.queue.push(new Command(cmd, args, next));
	}

	/**
	 * Clear the queue and return all the removed commands.
	 * @returns {void}
	 */
	drain() {
		var data = this.queue;
		this.queue = [];
		return data;
	}

	/**
	 * Clear the queue by rejecting all the commands.
	 * @param {any} err The error to send.
	 * @returns {void}
	 */
	flush(err) {
		for (const entry in this.drain()) {
			entry.handler.reject(err);
		}
	}

}

class Command {

	/**
	 * @param {string} cmd The command name to execute.
	 * @param {any[]} args The arguments for the command to execute.
	 * @param {Object} handler The Resolve and Reject references for the promise.
	 */
	constructor(cmd, args, handler) {
		this.cmd = cmd;
		this.args = args;
		this.handler = handler;
	}

	/**
	 * Converts the command into an array.
	 * @returns {any[]}
	 */
	toArray() {
		return [this.cmd].concat(this.args).concat([this.handler]);
	}

}

module.exports = OfflineQueue;
