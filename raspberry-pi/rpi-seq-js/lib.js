const { createInterface } = require("readline/promises");
const os = require("os");
const { EventEmitter } = require("events");

const unresolved = new Promise(() => 0);
let _piTimer = null;
/** @type {import("onoff").Gpio?} */
let Gpio;
/** @type {import("node-dht-sensor")?} */
let dht;
const platform = `${os.platform()} ${os.machine()} ${os.cpus().length} threads`;
const network = (() => {
    const nets = os.networkInterfaces();
    const results = []

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                results.push(`${name}=${net.address}`);
            }
        }
    }

    return results.join(",");
})();
const hostname = os.hostname();

/** @type {Promise<void>} */
let initialized = null;

const gpios = {};

const lib = module.exports = {
    async initialize() {
        if (initialized) return initialized;

        await new Promise(async (res) => {
            await lib.defer(10);

            const { onoff: { Gpio: _Gpio }, "node-dht-sensor": _dht } = require("./rebuild");
            Gpio = _Gpio;
            dht = _dht;
            // dht.setMaxRetries(5);
            res();
        })
    },
    hostname,
    platform,
    network,
    /** @returns {ReturnType<typeof lib.timer>} */
    getTimer() {
        return _piTimer = _piTimer || lib.timer(20);
    },
    async forever() {
        return unresolved;
    },
    dht(type, pin) {
        let reading = false;
        let lastValue;
        const time = lib.getTimer();

        /** @returns {Promise<{temperature: number, humidity: number}>} */
        const read = async () => {
            if (reading) return lastValue;

            while (true) {
                await time.queue();
                const val = await new Promise(res => dht.read(
                    type, pin,
                    (err, temperature, humidity) => err ? res() : res({temperature, humidity})
                ));
                if (val) return lastValue = val;
            }
        }

        const init = lib.initialize();

        return {
            read: async () => {
                await init;

                if (!lastValue) return read();
                read().catch(lib.noop);
                return lastValue;
            }
        }
    },
    button(pin, name = "btn") {
        if (gpios[pin]) return gpios[pin];

        const btn = new Gpio(pin, 'in', 'both');
        let value = 0;
        
        btn.watch((err, val) => {
            if (!err) { value = val };
        });

        process.on("beforeExit", () => {
            btn.unexport();
        })

        return {
            pin,
            get value() { return value; },
            async read() { return { [name]: value }; }
        };
    },
    led(pin, name = "led", initState = 0) {
        if (gpios[pin]) return gpios[pin];

        const led = new Gpio(pin, 'out');
        let value = initState;

        const write = async (input) => {
            value = +!!input;

            await led.write(value);
            return value;
        }

        process.on("beforeExit", () => {
            led.writeSync(0);
            led.unexport();
        })

        return {
            pin,
            get value() { return value; },
            async read() { return { [name]: value }; },
            toggle: async () => write(!value),
            on: async () => write(1),
            off: async () => write(0),
        }
    },
    /**
     *
     * @param {import("stream").Readable} input
     * @param {(type: string, obj: string, value: string) => Promise<void>} callback
     */
    async readCommandLines(input, callback) {
        const rl = createInterface({ input })
        for await (const message of rl) {
            try {
                const [type, obj, value] = message.trim().split(':');
                await callback(type, obj, value);
            } catch {

            }
        }
    },
    /**
     * Reads from multiple sources
     *
     * @param {{read(): Promise<{[measurement: string]: number}>}[]} sources
     * @param {Record<string, any>} extra
     * @returns
     */
    readStreamFromSources(sources, extra) {
        if (!Array.isArray(sources)) throw new Error("sources must be an array");
        let allok = true;
        for (let i = 0; i<sources.length; i++) {
            x = sources[i]
            if (typeof x.read !== "function") {
                allok = false;
                console.warn(`Source ${i} doesn't expose the right interface`);
            }
        }

        if (!allok) throw new Error("Some sources do not expose read interface");

        return (async function*() {
            while (true) {
                const data = await Promise.all(sources.map(
                    (source) => source.read().catch(lib.defer.bind(lib, 100))
                ));
                yield Object.assign({}, extra, ...data.filter(x => x));
            }
        })();
    },
    /**
     * Returns a change stream - only returns the values that have changed.
     *
     * @param {Iterable<{[measurement: string]: number}>} _iterable
     * @param  {...any} args
     * @returns
     */
    changes(iterable, changedInterval = 20, nonChangedInterval = 100) {
        return (async function* () {
            let lastChunk = "";
            for await (const chunk of iterable) {
                const chunkString = Object.entries(chunk).map(x => `${x}`).sort().join(";");
                if (lastChunk !== chunkString) {
                    yield { ts: Date.now(), ...chunk };
                    await lib.defer(changedInterval);
                } else {
                    await lib.defer(nonChangedInterval);
                }
                lastChunk = chunkString;
            }
        })();
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
        timer._queue = queue;

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