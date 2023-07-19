const { platform, hostname, network, led, dht, changes, initialize, readStreamFromSources, readCommandLines, getTimer } = require("./lib");

module.exports = [
    { requires: "pi-control", contentType: "text/plain" },
    async function(input, dhtGpio = "14", redGpio = "22", ylwGpio = "27", grnGpio = "17") {
        this.logger.info("Loading libraries...");

        await initialize();

        this.logger.info(`Initializing leds on pins:`, {redGpio, ylwGpio, grnGpio});

        // Initialize leds
        const leds = {
            red: led(+redGpio, "red led"),
            ylw: led(+ylwGpio, "ylw led"),
            grn: led(+grnGpio, "grn led")
        };

        this.logger.info(`Initializing dht(11, ${+dhtGpio})`);

        const ht = dht(11, +dhtGpio)

        this.logger.info("Initializing input commands");

        readCommandLines(input, async (type, obj, value) => {
            if (type !== "led") this.logger.warn(`Unknown command ${type}`);
            if (!leds[obj]) this.logger.warn(`Led ${obj} is not one of: [${Object.keys(leds).join(",")}]`);
            if (!leds[obj][value]) this.logger.warn(`Led ${obj} does not support command ${value}`);

            await leds[obj][value]();
            this.logger.info(`Called ${obj}..${value}`);
        });

        this.logger.info("Intializing output");

        // generate output
        return Object.assign(
            changes(readStreamFromSources(
                [ht, leds.grn, leds.ylw, leds.red],
                { platform, hostname, network }
            )),
            {topic: "pi-measurement", contentType: "text/x-ndjson"}
        );
    }
]