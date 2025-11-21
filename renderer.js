(async () => {
    const saved = await window.api.getFolder();
    if (saved) {
        document.getElementById("folder").innerText = saved;
    }
})();

document.getElementById("choose").onclick = async () => {

    const folder = await window.api.chooseFolder();

    if (!folder){
        document.getElementById("status").innerText = "No folder "
        return;
    }

    document.getElementById("folder").innerText = folder;
    document.getElementById("status").innerText = "Folder set. You can now start watching.";
    window.api.setFolder(folder);
};
