const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let pendingFilePath = null; // File path passed via CLI (e.g. double-click on .tramado)

// ── Detect if a .tramado file was passed as an argument (Windows file association) ──
function extractFilePath(argv) {
  // In production, argv[1] may be the .tramado file path
  // In dev, argv includes '--dev', so skip that
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const tramadoFile = args.find(a => a.toLowerCase().endsWith('.tramado') && fs.existsSync(a));
  return tramadoFile || null;
}

function createWindow(filePath) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    title: 'Tramado — Pattern Studio',
    icon: path.join(__dirname, '../public/favicon.svg')
  });

  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Once the renderer is ready, send the file path if one was provided
  mainWindow.webContents.on('did-finish-load', () => {
    const fp = filePath || pendingFilePath;
    if (fp) {
      pendingFilePath = null;
      sendFileToRenderer(fp);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function sendFileToRenderer(filePath) {
  if (!mainWindow) return;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const project = JSON.parse(raw);
    mainWindow.webContents.send('open-tramado-file', project);
  } catch (err) {
    dialog.showErrorBox('Error al abrir el archivo', `No se pudo leer el archivo:\n${filePath}\n\n${err.message}`);
  }
}

// ── IPC: renderer asks to open a file manually ──
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir proyecto Tramado',
    filters: [{ name: 'Tramado Pattern', extensions: ['tramado'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    sendFileToRenderer(result.filePaths[0]);
  }
});

// ── IPC: renderer asks to save a file ──
ipcMain.handle('save-file-dialog', async (_e, jsonString, suggestedName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar proyecto Tramado',
    defaultPath: suggestedName || 'mi_patron.tramado',
    filters: [{ name: 'Tramado Pattern', extensions: ['tramado'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, jsonString, 'utf-8');
    return result.filePath;
  }
  return null;
});

// ── Windows: handle second-instance (user double-clicks .tramado while app is open) ──
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const fp = extractFilePath(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (fp) sendFileToRenderer(fp);
    }
  });

  app.whenReady().then(() => {
    pendingFilePath = extractFilePath(process.argv);
    createWindow(pendingFilePath);

    // ── Check for updates ──
    if (!process.argv.includes('--dev')) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(null);
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
