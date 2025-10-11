/**
 * Settings Management IPC Handlers
 */

import { ipcMain } from 'electron';

// In-memory settings storage (could be persisted to file)
const settings: any = {
  language: 'en',
  privacy: 'local',
  whisperModel: 'base',
  ollamaModel: 'llama3',
  theme: 'dark'
};

ipcMain.handle('settings:get', async (): Promise<any> => {
  return { ...settings };
});

ipcMain.handle('settings:set', async (_event, newSettings: any): Promise<any> => {
  Object.assign(settings, newSettings);
  return { ...settings };
});

ipcMain.handle('settings:reset', async (): Promise<any> => {
  settings.language = 'en';
  settings.privacy = 'local';
  settings.whisperModel = 'base';
  settings.ollamaModel = 'llama3';
  settings.theme = 'dark';
  return { ...settings };
});



