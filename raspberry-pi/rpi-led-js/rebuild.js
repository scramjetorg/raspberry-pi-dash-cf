try {
    module.exports = {
        onoff: require("onoff"),
        "node-dht-sensor": require("node-dht-sensor")
    }
} catch {
    require("child_process").execSync("npm rebuild", { cwd: __dirname });

    module.exports = {
        onoff: require("onoff"),
        "node-dht-sensor": require("node-dht-sensor")
    }
}