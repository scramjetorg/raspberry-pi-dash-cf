const path = require("path");
const ws = require('ws');
const fs = require("fs");

const location = path.dirname(process.env.SEQUENCE_PATH);
const CLOUDFLARED_DIR = path.join(location, ".cloudflared");

// reinstall dependencies
const npmi = require("child_process").spawn("npm", ["ci"], { cwd: location });

npmi.stdout.pipe(process.stdout);
npmi.stderr.pipe(process.stderr);

const port = process.env.PORT || 3000;

const reactBuild = path.join(__dirname, "public");
const { tunnel, bin, install } = require("cloudflared");
const EventEmitter = require("events");
const { PassThrough } = require("stream");
const { tmpdir } = require("os");
const { pid } = require("process");

async function tunnelSetup(tunnelCredsFilename) {
    if (!fs.existsSync(bin)) {
        console.log("Installing cloudflared");
        await install(bin);
    }

    console.log("cloudflared installed.");

    const params = {
        "--url": "localhost:" + port,
        "run": null
    }

    if (tunnelCredsFilename) {
        params["--credentials-file"] = tunnelCredsFilename;
        params[tunnelCredsFilename.substr(0, tunnelCredsFilename.lastIndexOf('.'))] = null;
    }

    const { child } = tunnel(params);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
}

function getTunnelCredsFilename(config) {
    if (config.cloudflared) {
        const file = path.join(tmpdir(), `cloudflare.${pid}.json`);
        fs.writeFileSync(file, JSON.stringify(config.cloudflared, null, 2));

        return file;
    }

    const tunnelCredsFile = fs.readdirSync(CLOUDFLARED_DIR, { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .find(item => path.extname(item.name) === ".json");

    return tunnelCredsFile && tunnelCredsFile.path;
}

module.exports = [
    { requires: "pi-measurement", contentType: "text/x-ndjson" },
    async function (input, controlTopic = "pi-control") {
        const output = { 
            ...new PassThrough({ encoding: "utf-8", objectMode: true }), 
            provides: controlTopic, 
            contentType: "text/plain"
        };
        const emitter = new EventEmitter();

        setInterval(() => emitter.emit("tick"), 1000);

        // wait for `npm i` finish
        await new Promise((res, rej) => {
            npmi.on("close", res);
            npmi.on("error", rej);
        });

        const express = require('express');
        const app = express();
        const wsServer = new ws.Server({ noServer: true });

        async function reader() {
            for await (const stringChunk of input) {
                wsServer.clients.forEach(function (client) {
                    try {
                        const chunk = JSON.stringify(stringChunk);
                        client.send(chunk, (err) => {
                            if (err) console.error(err);
                        });
                    } catch {
                        console.error("Couldn't parse message...");
                    }
                });
            }
        }

        wsServer.on('connection', socket => {
            console.log("connected");
            socket.on('message', message => output.write(`${message}\n`));
        });

        reader();

        const server = app.listen(port, () => console.log(`Listening on port ${port}`));

        server.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
            });
        });

        app.use(express.static(reactBuild));
        app.get("*", async (req, res) => {
            res.sendFile(path.join(reactBuild, "index.html"));
        });

        await tunnelSetup(getTunnelCredsFilename(this.config));

        return output;
    }
];
