const Readable = require("stream");

module.exports = async function* (input) {
	for await (const chunk of input)
		yield chunk;
}
