const path = require("path");
const ws = require('ws');

const location = path.dirname(process.env.SEQUENCE_PATH);

const { tunnelSetup, getTunnelCredsFilename } = require("./lib");

// reinstall dependencies
const npmi = require("child_process").spawn("npm", ["ci"], { cwd: location });

npmi.stdout.pipe(process.stdout);
npmi.stderr.pipe(process.stderr);

const port = process.env.PORT || 3000;

const reactBuild = path.join(__dirname, "public");
const { PassThrough } = require("stream");

module.exports = [
    { requires: "pi-measurement", contentType: "text/x-ndjson" },
    async function (input, controlTopic = "pi-control") {
        const output = Object.assign(
            new PassThrough({ encoding: "utf-8", objectMode: true }),
            {
                provides: controlTopic, 
                contentType: "text/plain"
            }
        );

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
