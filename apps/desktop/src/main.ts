import { app, BrowserWindow, shell, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Smart School Management System',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Safe external navigation handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only open HTTP/HTTPS links externally via default browser
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Block in-app navigation away from the frontend app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isAllowed = isDev
      ? url.startsWith(devServerUrl)
      : url.startsWith('file://');

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch((err) => {
      console.warn('Vite dev server not yet ready, loading fallback notification:', err.message);
      mainWindow?.loadURL(
        `data:text/html,<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#f8fafc">` +
        `<h2>Smart School ERP - Desktop Development Shell</h2>` +
        `<p>Waiting for the Vite dev server at <code>${devServerUrl}</code>...</p>` +
        `<p>Run <code>npm run dev:web</code> from the workspace root to launch the frontend.</p>` +
        `</body></html>`
      );
    });
  } else {
    const indexPath = path.join(__dirname, '../../web/dist/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load production HTML:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Restricted IPC Handlers
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-platform', () => {
  return process.platform;
});

ipcMain.handle('app:ping', () => {
  return 'pong';
});

// Silent Printing & Hardware POS Support
ipcMain.handle('print:silent', async (_event, options: { deviceName?: string; silent?: boolean } = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  return new Promise((resolve) => {
    mainWindow?.webContents.print(
      {
        silent: options.silent ?? true,
        printBackground: true,
        deviceName: options.deviceName || '',
      },
      (success, failureReason) => {
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.handle('print:get-printers', async () => {
  if (!mainWindow) return [];
  return mainWindow.webContents.getPrintersAsync();
});

app.whenReady().then(() => {
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
