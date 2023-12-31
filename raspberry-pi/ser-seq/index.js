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
        params["--credentials-file"] = `${location}/.cloudflared/${tunnelCredsFilename}`;
        params[tunnelCredsFilename.substr(0, tunnelCredsFilename.lastIndexOf('.'))] = null;
    }

    const { child } = tunnel(params);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
}

function getTunnelCredsFilename() {
    const tunnelCredsFile = fs.readdirSync(CLOUDFLARED_DIR, { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .find(item => path.extname(item.name) === ".json");

    return tunnelCredsFile && tunnelCredsFile.name;
}

module.exports = [
    { requires: "pi", contentType: "text/plain" },
    async function (input) {
        // wait for `npm i` finish
        await new Promise((res, rej) => {
            npmi.on("close", res);
            npmi.on("error", rej);
        });

        const express = require('express');
        const app = express();
        const wsServer = new ws.Server({ noServer: true });

        async function reader() {
            for await (const chunk of input) {
                wsServer.clients.forEach(function (client) {
                    client.send(JSON.stringify(chunk), (err) => {
                        if (err) console.error(err);
                    });
                });
            }
        }

        wsServer.on('connection', socket => {
            console.log("connected");
            socket.on('message', message => console.log('server recevied: %s', message));
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

        await tunnelSetup(getTunnelCredsFilename());

        return input;
    }
];
