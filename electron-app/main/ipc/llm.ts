/**
 * LLM Operations IPC Handlers
 */

import { ipcMain } from 'electron';

const API_BASE = 'http://127.0.0.1:8000';

ipcMain.handle('llm:models', async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/llm/models`);
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}`, models: [] };
  } catch (error) {
    console.error('[IPC LLM] Models error:', error);
    return { error: String(error), models: [] };
  }
});

ipcMain.handle('llm:summarize', async (_event, text: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/llm/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}`, summary: '' };
  } catch (error) {
    console.error('[IPC LLM] Summarize error:', error);
    return { error: String(error), summary: '' };
  }
});

ipcMain.handle('llm:reply', async (_event, prompt: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/llm/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}`, reply: '' };
  } catch (error) {
    console.error('[IPC LLM] Reply error:', error);
    return { error: String(error), reply: '' };
  }
});

ipcMain.handle('llm:generate', async (_event, options: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/llm/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { error: `HTTP ${response.status}`, response: '' };
  } catch (error) {
    console.error('[IPC LLM] Generate error:', error);
    return { error: String(error), response: '' };
  }
});



