const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let store;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load from Vite dev server in development, or from built files in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const fileList = await Promise.all(files.map(async file => {
      const filePath = path.join(dirPath, file.name);
      let stats = null;
      try {
        stats = await fs.stat(filePath);
      } catch (e) {
        // Handle permission errors
      }
      return {
        name: file.name,
        isDirectory: file.isDirectory(),
        path: filePath,
        size: stats ? stats.size : 0,
        modified: stats ? stats.mtime : null,
      };
    }));
    return fileList;
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
});

ipcMain.handle('get-home-dir', () => {
  return app.getPath('home');
});

ipcMain.handle('get-setting', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('rename-file', async (event, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    await fs.rename(oldPath, newPath);
    return { success: true, newPath };
  } catch (error) {
    throw new Error(`Failed to rename: ${error.message}`);
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete: ${error.message}`);
  }
});

ipcMain.handle('create-folder', async (event, dirPath, folderName) => {
  try {
    const newPath = path.join(dirPath, folderName);
    await fs.mkdir(newPath);
    return { success: true, path: newPath };
  } catch (error) {
    throw new Error(`Failed to create folder: ${error.message}`);
  }
});

ipcMain.handle('create-file', async (event, dirPath, fileName) => {
  try {
    const newPath = path.join(dirPath, fileName);
    await fs.writeFile(newPath, '');
    return { success: true, path: newPath };
  } catch (error) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
});

ipcMain.handle('copy-file', async (event, sourcePath, destPath) => {
  try {
    await fs.cp(sourcePath, destPath, { recursive: true });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to copy: ${error.message}`);
  }
});

ipcMain.handle('move-file', async (event, sourcePath, destPath) => {
  try {
    await fs.rename(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to move: ${error.message}`);
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath);
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});
