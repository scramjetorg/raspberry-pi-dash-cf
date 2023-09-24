const { led, initialize, getCommandLineIterator } = require("@scramjet/robo-lib");

module.exports = [
    { requires: "pi-led", contentType: "text/plain" },
    async function(input, ...ledgpios) {
        this.logger.info("Loading libraries...");

        await initialize();

        this.logger.info(`Initializing leds on pins: ${1}`);

        // Initialize leds
        const leds = Object.fromEntries(ledgpios.map(arg => {
            const [name, gpio] = arg.split("=");
            return [name, led(+gpio, name, 0)];
        }));

        this.logger.info("Iterating input commands");

        const commands = getCommandLineIterator(input);

        for await (const { type, obj, value } of commands) {
            if (type !== "led") this.logger.warn(`Unknown command ${type}`);
            if (!leds[obj]) this.logger.warn(`No such led connected ${obj}`);
            if (typeof leds[obj][""] !== "function") this.logger.warn(`No such led connected ${obj}`);

            await leds[obj][value]();

            console.log(leds[obj]);
        }
    }
]