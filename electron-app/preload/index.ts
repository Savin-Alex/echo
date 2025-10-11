/**
 * Preload Script - Secure Bridge between Main and Renderer
 * 
 * Exposes a safe, typed API to the renderer process.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface EchoAPI {
  // Health
  ping: () => Promise<boolean>;
  getStatus: () => Promise<any>;
  
  // Capture
  startCapture: (options?: any) => Promise<any>;
  stopCapture: () => Promise<any>;
  
  // Context
  contextLoad: (path: string) => Promise<any>;
  contextSearch: (query: string) => Promise<any>;
  contextClear: () => Promise<any>;
  contextStats: () => Promise<any>;
  
  // LLM
  models: () => Promise<any>;
  summarize: (text: string, language?: string) => Promise<{ summary: string; error?: string; language?: string }>;
  reply: (prompt: string, language?: string) => Promise<{ reply: string; error?: string; language?: string }>;
  generate: (options: any) => Promise<any>;
  
  // Settings
  getSettings: () => Promise<any>;
  setSettings: (settings: any) => Promise<any>;
  resetSettings: () => Promise<any>;
}

// Expose the API to the renderer
contextBridge.exposeInMainWorld('echo', {
  // Health
  ping: () => ipcRenderer.invoke('health:ping'),
  getStatus: () => ipcRenderer.invoke('health:status'),
  
  // Capture
  startCapture: (options?: any) => ipcRenderer.invoke('capture:start', options),
  stopCapture: () => ipcRenderer.invoke('capture:stop'),
  
  // Context
  contextLoad: (path: string) => ipcRenderer.invoke('context:load', path),
  contextSearch: (query: string) => ipcRenderer.invoke('context:search', query),
  contextClear: () => ipcRenderer.invoke('context:clear'),
  contextStats: () => ipcRenderer.invoke('context:stats'),
  
  // LLM
  models: () => ipcRenderer.invoke('llm:models'),
  summarize: (text: string, language?: string) => ipcRenderer.invoke('llm:summarize', text, language || 'en'),
  reply: (prompt: string, language?: string) => ipcRenderer.invoke('llm:reply', prompt, language || 'en'),
  generate: (options: any) => ipcRenderer.invoke('llm:generate', options),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset')
} as EchoAPI);

// TypeScript type definitions for window.echo
declare global {
  interface Window {
    echo: EchoAPI;
  }
}




