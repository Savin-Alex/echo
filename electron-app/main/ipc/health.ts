/**
 * Health Check IPC Handlers
 */

import { ipcMain } from 'electron';

const API_BASE = 'http://127.0.0.1:8000';

ipcMain.handle('health:ping', async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    console.error('[IPC Health] Ping failed:', error);
    return false;
  }
});

ipcMain.handle('health:status', async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      return await response.json();
    }
    return { status: 'error', error: `HTTP ${response.status}` };
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
});




