/**
 * Electron Main Process
 * 
 * Manages application lifecycle, window creation, and Python backend.
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';

// Import IPC handlers
import './ipc/health';
import './ipc/capture';
import './ipc/context';
import './ipc/llm';
import './ipc/settings';

let mainWindow: BrowserWindow | null = null;
let pythonBackend: ChildProcess | null = null;
const isDev = process.argv.includes('--dev');

/**
 * Start Python FastAPI backend as subprocess
 */
async function startPythonBackend(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const pythonPath = path.join(__dirname, '../../../python-workers');
    
    // Determine Python executable path
    const isWin = process.platform === 'win32';
    const venvPython = isWin
      ? path.join(pythonPath, '.venv/Scripts/python.exe')
      : path.join(pythonPath, '.venv/bin/python');
    
    console.log('[Main] Starting Python backend...');
    console.log('[Main] Python path:', venvPython);
    console.log('[Main] Working directory:', pythonPath);
    
    // Start uvicorn server
    pythonBackend = spawn(venvPython, [
      '-m', 'uvicorn',
      'app.main:app',
      '--host', '127.0.0.1',
      '--port', '8000',
      '--log-level', 'info'
    ], {
      cwd: pythonPath,
      env: { ...process.env }
    });
    
    let started = false;
    
    // Handle stdout
    pythonBackend.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[Python Backend] ${output}`);
      
      // Check if server is ready
      if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
        if (!started) {
          started = true;
          console.log('[Main] ✅ Python backend ready');
          resolve();
        }
      }
    });
    
    // Handle stderr
    pythonBackend.stderr?.on('data', (data: Buffer) => {
      console.error(`[Python Backend Error] ${data.toString()}`);
    });
    
    // Handle process errors
    pythonBackend.on('error', (error: Error) => {
      console.error('[Main] Python backend error:', error);
      reject(error);
    });
    
    // Handle process exit
    pythonBackend.on('exit', (code: number | null) => {
      console.log(`[Main] Python backend exited with code ${code}`);
      pythonBackend = null;
    });
    
    // Timeout fallback (10 seconds)
    setTimeout(() => {
      if (!started) {
        console.log('[Main] ⚠️  Python backend timeout, continuing anyway...');
        resolve();
      }
    }, 10000);
  });
}

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
      webSecurity: true
    },
    backgroundColor: '#1a1a1a',
    show: false // Show after ready-to-show
  });
  
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
  
  // Kill Python backend
  if (pythonBackend) {
    console.log('[Main] Stopping Python backend...');
    pythonBackend.kill('SIGTERM');
    pythonBackend = null;
  }
}

// Application lifecycle

app.whenReady().then(async () => {
  console.log('[Main] Electron app ready');
  
  try {
    // Start Python backend first
    await startPythonBackend();
  } catch (error) {
    console.error('[Main] Failed to start Python backend:', error);
    console.log('[Main] Continuing without backend...');
  }
  
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



