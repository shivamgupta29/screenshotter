const { app, Tray, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const {setWatchFolder, startWatcher, stopWatcher} = require("./index")
const store = require("./store")

let tray = null;
let win = null;


// Create Window function

function createWindow() {
    if (win) {
        win.focus();
        return;
    }

    win = new BrowserWindow({
        width: 500,
        height: 500,
        maxHeight: 600,
        maxWidth: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.setMenu(null);
    win.loadFile("index.html");
    win.once("ready-to-show", () => win.show());

    win.on("closed", () => {
        win = null;
    });
}


// Create Tray function

function createTray() {
    const iconPath = path.join(__dirname, "icon.png");

    tray = new Tray(iconPath);
    tray.setIgnoreDoubleClickEvents(true);

    const menu = Menu.buildFromTemplate([
        { label: "Preferences", click: createWindow },
        { type: "separator" },
        { 
            label: "Start", 
            click: () => {
                if (!global.watchFolderPath) {
                    console.log("Cannot start: No folder chosen.");
                    return;
                }
                startWatcher();
            }
        },
        { 
            label: "Stop", 
            click: () => {
                if (!global.watchFolderPath) {
                    console.log("Cannot stop: No folder chosen.");
                    return;
                }
                stopWatcher();
            }
        },
        { type: "separator" },
        { label: "Quit", click: () => app.quit() }
    ]);

    tray.setToolTip("Screenshotter");
    tray.setContextMenu(menu);
}


// IPC Handling

ipcMain.handle("dialog:openFolder", async () => {
    console.log("MAIN: dialog open triggered");

    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"]
    });

    console.log("MAIN: dialog result =", canceled, filePaths);

    if (canceled || !filePaths.length) return null;
    const folder = filePaths[0];
    store.set("screenshotFolder", folder);
    return folder;
});

ipcMain.on("watcher:setFolder", (event, folder) => {
    console.log("MAIN: received folder", folder);
    setWatchFolder(folder);
});

ipcMain.handle("getFolder", ()=> store.get("screenshotFolder") || null)

app.whenReady().then(()=>{
    createTray();
    const saved = store.get("screenshotFolder");
    if(saved){
        setWatchFolder(saved);
        startWatcher();
    }
});

app.setLoginItemSettings({
    openAtLogin: true,
    enabled: true
})

app.on("activate", () => {
    if (!win) createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
