/**
 * Context Management IPC Handlers
 */

import { ipcMain } from 'electron';

const API_BASE = 'http://127.0.0.1:8000';

ipcMain.handle('context:load', async (_event, path: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/context/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: path, redact_pii: true })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}` };
  } catch (error) {
    console.error('[IPC Context] Load error:', error);
    return { error: String(error) };
  }
});

ipcMain.handle('context:search', async (_event, query: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/context/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k: 5 })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}`, matches: [] };
  } catch (error) {
    console.error('[IPC Context] Search error:', error);
    return { error: String(error), matches: [] };
  }
});

ipcMain.handle('context:clear', async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/context/clear`, {
      method: 'POST'
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}` };
  } catch (error) {
    console.error('[IPC Context] Clear error:', error);
    return { error: String(error) };
  }
});

ipcMain.handle('context:stats', async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/context/stats`);
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}` };
  } catch (error) {
    console.error('[IPC Context] Stats error:', error);
    return { error: String(error) };
  }
});




