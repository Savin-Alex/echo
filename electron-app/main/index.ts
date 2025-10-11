/**
 * Electron Main Process
 * 
 * Manages application lifecycle, window creation, and Python backend.
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';

// Import IPC handlers
import './ipc/health';
import './ipc/capture';
import './ipc/context';
import './ipc/llm';
import './ipc/settings';

let mainWindow: BrowserWindow | null = null;
const isDev = process.argv.includes('--dev');

/**
 * Create main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: isDev // Enable devTools only in development
    },
    backgroundColor: '#1a1a1a',
    show: false // Show after ready-to-show
  });
  
  // Set Content Security Policy for production
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:8000"
          ]
        }
      });
    });
  }
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
  
  // Load URL based on environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  }
  
  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Cleanup on application exit
 */
function cleanup(): void {
  console.log('[Main] Cleaning up...');
  // Python backend is managed by root npm process, not cleaned up here
}

// Application lifecycle

app.whenReady().then(async () => {
  console.log('[Main] Electron app ready');
  
  // Note: Python backend is started by root npm run dev:python
  // We don't start it here to avoid port conflicts
  console.log('[Main] Python backend should be running on http://127.0.0.1:8000');
  
  // Create main window
  createWindow();
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  cleanup();
});

app.on('will-quit', () => {
  cleanup();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Main] Unhandled rejection:', reason);
});




