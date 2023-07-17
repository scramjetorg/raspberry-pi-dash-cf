const path = require("path");
const ws = require('ws');
const fs = require("fs");

const location = path.dirname(process.env.SEQUENCE_PATH);
const CLOUDFLARED_DIR = path.join(location, ".cloudflared");

const port = process.env.PORT || 3000;

const { tunnel, bin, install } = require("cloudflared");
const { tmpdir } = require("os");
const { pid } = require("process");

async function tunnelSetup(tunnelCredsFilename) {
    // reinstall dependencies
    const npmi = require("child_process").spawn("npm", ["rebuild"], { cwd: location });

    npmi.stdout.pipe(process.stdout);
    npmi.stderr.pipe(process.stderr);

    // wait for `npm i` finish
    await new Promise((res, rej) => {
        npmi.on("close", res);
        npmi.on("error", rej);
    });

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
    tunnelSetup,
    getTunnelCredsFilename
];
