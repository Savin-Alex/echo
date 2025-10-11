/*
 * The preload script runs in the renderer process before any web content is
 * loaded. It exposes a safe API to the renderer using context isolation.
 * See: https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */

const { contextBridge, ipcRenderer } = require('electron');

// Security: Whitelist of allowed IPC channels
const ALLOWED_CHANNELS = [
  'fetch-suggestions',
  'get-transcript',
  'start-session',
  'stop-session',
  'get-settings',
  'update-settings',
  'save-profile',
  'get-profile'
];

const ALLOWED_EVENTS = [
  'suggestions',
  'loading-suggestions',
  'transcript-update',
  'session-started',
  'session-stopped',
  'session-update',
  'web-lookup',
  'overlay-shown',
  'overlay-hidden',
  'toggle-stealth',
  'show-hotkeys'
];

// Security: Validate channel names
function validateChannel(channel) {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  }
  return true;
}

// Security: Validate event names
function validateEvent(eventName) {
  if (!ALLOWED_EVENTS.includes(eventName)) {
    throw new Error(`Unauthorized IPC event: ${eventName}`);
  }
  return true;
}

// Security: Sanitize strings before IPC
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.trim().substring(0, 10000); // Limit length
}

// Security: Sanitize objects before IPC
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof key === 'string' && key.length < 100) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

contextBridge.exposeInMainWorld('echo', {
  // Suggestion management
  getSuggestions: async (context, options = {}) => {
    validateChannel('fetch-suggestions');
    const sanitizedContext = sanitizeString(context);
    const sanitizedOptions = sanitizeObject(options);
    return ipcRenderer.invoke('fetch-suggestions', sanitizedContext, sanitizedOptions);
  },

  onSuggestions: (callback) => {
    validateEvent('suggestions');
    const handler = (_, suggestions, options) => {
      callback(suggestions, options);
    };
    ipcRenderer.on('suggestions', handler);
    return () => ipcRenderer.removeListener('suggestions', handler);
  },

  onLoadingSuggestions: (callback) => {
    validateEvent('loading-suggestions');
    const handler = () => {
      callback();
    };
    ipcRenderer.on('loading-suggestions', handler);
    return () => ipcRenderer.removeListener('loading-suggestions', handler);
  },

  // Transcript management
  getPartialTranscript: async () => {
    validateChannel('get-transcript');
    return ipcRenderer.invoke('get-transcript');
  },

  onTranscriptUpdate: (callback) => {
    validateEvent('transcript-update');
    const handler = (_, transcriptData) => {
      callback(transcriptData);
    };
    ipcRenderer.on('transcript-update', handler);
    return () => ipcRenderer.removeListener('transcript-update', handler);
  },

  // Session management
  startSession: async (options = {}) => {
    validateChannel('start-session');
    const sanitizedOptions = sanitizeObject(options);
    return ipcRenderer.invoke('start-session', sanitizedOptions);
  },

  stopSession: async () => {
    validateChannel('stop-session');
    return ipcRenderer.invoke('stop-session');
  },

  onSessionStarted: (callback) => {
    validateEvent('session-started');
    const handler = (_, session) => {
      callback(session);
    };
    ipcRenderer.on('session-started', handler);
    return () => ipcRenderer.removeListener('session-started', handler);
  },

  onSessionStopped: (callback) => {
    validateEvent('session-stopped');
    const handler = (_, sessionData) => {
      callback(sessionData);
    };
    ipcRenderer.on('session-stopped', handler);
    return () => ipcRenderer.removeListener('session-stopped', handler);
  },

  onSessionUpdate: (callback) => {
    validateEvent('session-update');
    const handler = (_, session) => {
      callback(session);
    };
    ipcRenderer.on('session-update', handler);
    return () => ipcRenderer.removeListener('session-update', handler);
  },

  // Web lookup
  onWebLookup: (callback) => {
    validateEvent('web-lookup');
    const handler = (_, data) => {
      callback(data);
    };
    ipcRenderer.on('web-lookup', handler);
    return () => ipcRenderer.removeListener('web-lookup', handler);
  },

  // Overlay management
  onOverlayShown: (callback) => {
    validateEvent('overlay-shown');
    const handler = () => {
      callback();
    };
    ipcRenderer.on('overlay-shown', handler);
    return () => ipcRenderer.removeListener('overlay-shown', handler);
  },

  onOverlayHidden: (callback) => {
    validateEvent('overlay-hidden');
    const handler = () => {
      callback();
    };
    ipcRenderer.on('overlay-hidden', handler);
    return () => ipcRenderer.removeListener('overlay-hidden', handler);
  },

  onToggleStealth: (callback) => {
    validateEvent('toggle-stealth');
    const handler = (_, isStealthMode) => {
      callback(isStealthMode);
    };
    ipcRenderer.on('toggle-stealth', handler);
    return () => ipcRenderer.removeListener('toggle-stealth', handler);
  },

  onShowHotkeys: (callback) => {
    validateEvent('show-hotkeys');
    const handler = () => {
      callback();
    };
    ipcRenderer.on('show-hotkeys', handler);
    return () => ipcRenderer.removeListener('show-hotkeys', handler);
  },

  // Settings management
  getSettings: async () => {
    validateChannel('get-settings');
    return ipcRenderer.invoke('get-settings');
  },

  updateSettings: async (newConfig) => {
    validateChannel('update-settings');
    const sanitizedConfig = sanitizeObject(newConfig);
    return ipcRenderer.invoke('update-settings', sanitizedConfig);
  },

  // Profile management
  saveProfile: async (profileData) => {
    validateChannel('save-profile');
    const sanitizedProfile = sanitizeObject(profileData);
    return ipcRenderer.invoke('save-profile', sanitizedProfile);
  },

  getProfile: async () => {
    validateChannel('get-profile');
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

  // Transcript management
  onTranscript: (callback) => {
    validateEvent('transcript-update');
    const handler = (_, transcriptData) => {
      callback(transcriptData);
    };
    ipcRenderer.on('transcript-update', handler);
    return () => ipcRenderer.removeListener('transcript-update', handler);
  },

  // Utility functions (removed for security - no raw ipcRenderer access)
  // Window control should be handled through main process only

  // Debug and development (sanitized)
  log: (message, data) => {
    const sanitizedMessage = sanitizeString(message);
    const sanitizedData = sanitizeObject(data);
    console.log(`[Echo] ${sanitizedMessage}`, sanitizedData);
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