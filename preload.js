const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  renameFile: (oldPath, newName) => ipcRenderer.invoke('rename-file', oldPath, newName),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  createFolder: (dirPath, folderName) => ipcRenderer.invoke('create-folder', dirPath, folderName),
  createFile: (dirPath, fileName) => ipcRenderer.invoke('create-file', dirPath, fileName),
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke('copy-file', sourcePath, destPath),
  moveFile: (sourcePath, destPath) => ipcRenderer.invoke('move-file', sourcePath, destPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
