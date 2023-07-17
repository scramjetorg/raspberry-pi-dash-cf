const { createInterface } = require("readline/promises");
const { inspect } = require("util");
const { timer, led, dht, changes, defer, initialize } = require("./lib");
const os = require("os");

const platform = `${os.hostname()} (${os.platform()} ${os.machine()} ${os.cpus().length} threads`;

module.exports = [
    { requires: "pi-control", contentType: "text/plain" },
    async function(input, ledGpio = "14", dhtGpio = "17") {
        this.logger.info("Loading libraries...");
        await defer(10);
        
        initialize();

        const int = timer(100);

        this.logger.info("Initializing input reader");

        // Initialize leds
        const leds = {
            red: led(+ledGpio)
        };

        // Input reader
        (async () => {
            const rl = createInterface({ input })
            for await (const message of rl) {
                try {
                    this.logger.info("Got message", message);
                    const [type, obj, value] = message.trim().split(':');

                    switch(type) {
                        case "led": 
                            if (!leds[obj]) {
                                this.logger.warn("Invalid led name", obj);
                                continue;
                            }
                            if (typeof leds[obj][value] === "function") {
                                await leds[obj][value]();
                                this.logger.info(`Set state of led ${obj} to ${leds[obj].value} on pin ${leds[obj].pin}`);
                                continue;
                            }
                            this.logger.info(`No such function ${value}`, inspect(leds[obj]), {type, obj, value}, typeof leds[obj][value])
                            break;
                        default:
                            this.logger.warn("Unknown message type", type);
                    }
                } catch(e) {
                    this.logger.warn("error", e.stack);
                }
            }
        })();

        this.logger.info(`Initializing output from dht(11, ${+dhtGpio})`);

        const ht = dht(11, +dhtGpio)

        // generate output
        return Object.assign(
            changes(async function*() { 
                let data;
                while (true) {
                    try {
                        data = await ht.read();
                    } catch {}

                    yield {
                        platform,
                        ...Object.fromEntries(Object.entries(leds).map(([k, v]) => [`led:${k}`, v.value])),
                        ...data
                    };

                    await int.next();
                }
            }),
            {topic: "pi-measurement", contentType: "text/x-ndjson"}
        );
    }
]