const { PassThrough } = require("stream");

module.exports = [
	{ requires: "pi-measurement", contentType: "text/plain" },
	async function (input) {
		const out = input.pipe(new PassThrough({ encoding: "utf-8" }));

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
