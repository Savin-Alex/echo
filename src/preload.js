/*
 * The preload script runs in the renderer process before any web content is
 * loaded. It exposes a safe API to the renderer using context isolation.
 * See: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('echo', {
  // Suggestion management
  getSuggestions: async (context, options = {}) => {
    return ipcRenderer.invoke('fetch-suggestions', context, options);
  },

  onSuggestions: (callback) => {
    ipcRenderer.on('suggestions', (_, suggestions, options) => {
      callback(suggestions, options);
    });
  },

  onLoadingSuggestions: (callback) => {
    ipcRenderer.on('loading-suggestions', () => {
      callback();
    });
  },

  // Transcript management
  getPartialTranscript: async () => {
    return ipcRenderer.invoke('get-transcript');
  },

  onTranscriptUpdate: (callback) => {
    ipcRenderer.on('transcript-update', (_, transcriptData) => {
      callback(transcriptData);
    });
  },

  // Session management
  startSession: async (options = {}) => {
    return ipcRenderer.invoke('start-session', options);
  },

  stopSession: async () => {
    return ipcRenderer.invoke('stop-session');
  },

  onSessionStarted: (callback) => {
    ipcRenderer.on('session-started', (_, session) => {
      callback(session);
    });
  },

  onSessionStopped: (callback) => {
    ipcRenderer.on('session-stopped', (_, sessionData) => {
      callback(sessionData);
    });
  },

  onSessionUpdate: (callback) => {
    ipcRenderer.on('session-update', (_, session) => {
      callback(session);
    });
  },

  // Web lookup
  onWebLookup: (callback) => {
    ipcRenderer.on('web-lookup', (_, data) => {
      callback(data);
    });
  },

  // Overlay management
  onOverlayShown: (callback) => {
    ipcRenderer.on('overlay-shown', () => {
      callback();
    });
  },

  onOverlayHidden: (callback) => {
    ipcRenderer.on('overlay-hidden', () => {
      callback();
    });
  },

  onToggleStealth: (callback) => {
    ipcRenderer.on('toggle-stealth', (_, isStealthMode) => {
      callback(isStealthMode);
    });
  },

  onShowHotkeys: (callback) => {
    ipcRenderer.on('show-hotkeys', () => {
      callback();
    });
  },

  // Settings management
  getSettings: async () => {
    return ipcRenderer.invoke('get-settings');
  },

  updateSettings: async (newConfig) => {
    return ipcRenderer.invoke('update-settings', newConfig);
  },

  // Profile management
  saveProfile: async (profileData) => {
    return ipcRenderer.invoke('save-profile', profileData);
  },

  getProfile: async () => {
    return ipcRenderer.invoke('get-profile');
  },

  // Event callbacks (for renderer to communicate with main)
  onSuggestionSelected: (callback) => {
    // This will be called by the renderer when a suggestion is selected
    window.echoSuggestionSelected = callback;
  },

  onSettingsRequested: (callback) => {
    // This will be called by the renderer when settings are requested
    window.echoSettingsRequested = callback;
  },

  // Utility functions
  closeWindow: () => {
    ipcRenderer.send('close-window');
  },

  minimizeWindow: () => {
    ipcRenderer.send('minimize-window');
  },

  // Debug and development
  log: (message, data) => {
    console.log(`[Echo] ${message}`, data);
  },

  // Platform detection
  platform: process.platform,

  // Version info
  version: '1.0.0'
});

// Additional utilities for the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  isElectron: true
});