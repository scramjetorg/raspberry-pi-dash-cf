const { PassThrough } = require("stream");

module.exports = [
	{ requires: "pi-measurement", contentType: "text/x-ndjson" },
	async function (input) {
		const out = input.pipe(new PassThrough({ objectMode: true }));

		out.on("drain", () => { this.logger.info("drained"); });
		out.on("pause", () => { this.logger.info("paused"); });
		out.on("resume", () => { this.logger.info("resumed"); });
		out.on("end", () => { this.logger.info("ended"); });

		return Object.assign(
            out,
            {topic: "pi", contentType: "text/x-ndjson"}
        );
	}
]
