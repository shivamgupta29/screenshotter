const chokidar = require("chokidar");
const activeWin = require("active-win");
const path = require("path");
const fs = require("fs");

let watchFolderPath = null;
let watcher = null;

// Helpers
function shorten(str, max = 40) {
    return str.length > max ? str.slice(0, max).trim() + "..." : str;
}

function extractTitle(title) {
    if (!title) return "untitled";

    const parts = title.split(/[-—|:]/);
    return parts[0].trim() || "untitled";
}

function normalizeAppName(app) {
    if (!app) return "unknown";

    return app
        .trim()
        .toLowerCase()
        .replace(/[\s\.]+/g, "-")      // spaces & dots → hyphens
        .replace(/[^a-z0-9-]/g, "");   // remove any weird characters
}

function generateName(app, title) {
    const appName = normalizeAppName(app);
    const cleanTitle = shorten(
        extractTitle(title).replace(/[\/\\?%*:|"<>]/g, "-")
    );

    return `${appName}-${cleanTitle}.png`;
}

function avoidCollision(filePath) {
    if (!fs.existsSync(filePath)) return filePath;

    let count = 1;
    const ext = path.extname(filePath);
    const base = filePath.substring(0, filePath.length - ext.length);

    while (fs.existsSync(`${base} (${count})${ext}`)) {
        count++;
    }

    return `${base} (${count})${ext}`;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main handler
async function handleScreenShot(filePath) {
    if (!filePath.endsWith(".png") && !filePath.endsWith(".jpg")) return;
    if (!watchFolderPath) return console.error("No watch folder set.");
    // For handling the infinie loop problem i was facing  
    const base = path.basename(filePath);

    const isOriginalScreenshot =
        base.startsWith("Screenshot") ||
        base.startsWith("Screenshot from") ||
        /^Screenshot.*\.png$/i.test(base);

    if (!isOriginalScreenshot) {
        return;
    }

    await wait(250);

    let info = null;
    try {
        info = await activeWin();
    } catch {}

    const app = info?.owner?.name || "UnknownApp";
    const title = info?.title || "Untitled";

    const newName = generateName(app, title);
    const newPath = path.join(watchFolderPath, newName);
    const finalPath = avoidCollision(newPath);

    fs.rename(filePath, finalPath, (err) => {
        if (err) console.error("Rename error:", err);
        else console.log(`Renamed to: ${finalPath}`);
    });
}

// Public API
function setWatchFolder(folderPath) {
    console.log("Watch folder set to:", folderPath);
    watchFolderPath = folderPath;
    global.watchFolderPath = folderPath;
    if (watcher) {
        stopWatcher();
        startWatcher();
    }
}

function startWatcher() {
    if (!watchFolderPath)
        return console.error("Cannot start watcher: No folder selected.");

    if (watcher) {
        console.log("Watcher already running.");
        return;
    }

    console.log("Starting watcher on:", watchFolderPath);

    watcher = chokidar.watch(watchFolderPath, {
        ignoreInitial: true,
        depth: 0
    });

    watcher.on("add", handleScreenShot);
    watcher.on("error", (err) => console.error("Watcher error:", err));
}

function stopWatcher() {
    if (!watcher) {
        console.log("Watcher is not running.");
        return;
    }

    console.log("Stopping watcher...");
    watcher.close();
    watcher = null;
}

module.exports = {
    setWatchFolder,
    startWatcher,
    stopWatcher
};
