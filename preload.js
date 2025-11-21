const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    chooseFolder: () => {
        return ipcRenderer.invoke("dialog:openFolder");
    },
    setFolder: (folder) => {
        ipcRenderer.send("watcher:setFolder", folder);
    },
    getFolder: ()=> ipcRenderer.invoke("getFolder")
});
