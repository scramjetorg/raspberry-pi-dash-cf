const { EventEmitter } = require("events");
const { onoff: { Gpio }, "node-dht-sensor": dht } = require("./rebuild");

const unresolved = new Promise(() => 0);
let _piTimer = null;

const lib = module.exports = {
    getTimer() {
        return _piTimer = _piTimer || lib.timer(40);
    },
    async forever() {
        return unresolved;
    },
    dht(pin1, pin2) {

    },
    led(pin, initState = 0) {
        const time = lib.getTimer();
        const led = new Gpio(pin, 'out');
        let value = initState;

        const write = async (input) => {
            value = +!!input;

            await led.write(value);
            return value;
        }

        time.queue().then(() => write(initState));

        return {
            pin,
            get value() { return value },
            toggle: async () => time.queue().then(() => write(!value)),
            on: async () => time.queue().then(() => write(1)),
            off: async () => time.queue().then(() => write(0)),
        }
    },
    change(iterable) {
        return (function* () {
            let lastChunk = "";
            for (const chunk of iterable) {
                const chunkString = Object.entries(chunk).map(x => `${x}`).sort().join(";");
                if (lastChunk !== chunkString) yield chunk;
                lastChunk = chunkString;
            }
        });
    },
    noop: () => 0,
    timer(initialInterval = 1000) {
        let handle;
        let queue = [];

        const timer = Object.assign(
            new EventEmitter(),
            {
                    interval(interval) {
                    clearInterval(handle);
                    handle = setInterval(() => timer.emit("tick"), interval);
        
                    return timer;
                },
                async queue() {
                    return new Promise(res => {
                        queue.push(res);
                    });
                },
                async next() { 
                    return new Promise(res => timer.once("tick", res))
                }
            }
        );

        function movequeue() {
            if (queue.length) try { queue.shift()(); } catch {};
        }

        timer.on("tick", movequeue);
        timer.interval(initialInterval);

        return timer;
    },
    async defer(ms = 0) { 
        return new Promise(res => {
            if (+ms)
                setTimeout(res, ms);
            else
                process.nextTick(res);
        })}
}