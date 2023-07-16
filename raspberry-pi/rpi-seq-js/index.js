const { createInterface } = require("readline/promises");
const { inspect } = require("util");

module.exports = [
    { requires: "pi-control", contentType: "text/plain" },
    async function* (input, ledGpio = "14") {
        const { timer, led } = require("./lib");
        const int = timer(1000);

        // Initialize leds
        const leds = {
            red: led(+ledGpio)
        };

        this.logger.info("Initializing input reader");

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

        this.logger.info("Initializing output");

        // generate output
        while (true) {
            yield {
                ts: Date.now(),
                ...Object.fromEntries(Object.entries(leds).map(([k, v]) => [`led:${k}`, v.value]))
            }
            await int.next();
        }
    }
]