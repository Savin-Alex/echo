/*
 * Main process for the Echo application.
 *
 * This file sets up the Electron application with full integration of
 * ASR, LLM, database, and audio capture services. It manages the overlay
 * window, global shortcuts, session management, and real-time AI assistance.
 */

const { app, BrowserWindow, globalShortcut, ipcMain, screen, dialog, Menu } = require('electron');
const path = require('path');
const { EventEmitter } = require('events');

// Import services
const ASRService = require('./services/asr');
const LLMService = require('./services/llm');
const DatabaseService = require('./services/database');

class EchoApp extends EventEmitter {
  constructor() {
    super();
    this.overlayWindow = null;
    this.currentSession = null;
    this.isInitialized = false;
    this.config = {
      modelSize: 'tiny',
      provider: 'openai',
      stealthMode: false,
      autoStart: true
    };
    
    this.setupAppLifecycle();
  }

  async initialize() {
    try {
      console.log('Initializing Echo application...');
      
      // Initialize database first
      await DatabaseService.initialize();
      
      // Initialize ASR service
      await ASRService.initialize(this.config.modelSize);
      
      // Initialize LLM service with default config
      await LLMService.initialize({
        defaultProvider: this.config.provider
      });
      
      // Set up ASR event listeners
      ASRService.on('transcript', this.handleTranscript.bind(this));
      
      this.isInitialized = true;
      console.log('Echo application initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Echo application:', error);
      throw error;
    }
  }

  setupAppLifecycle() {
    // App ready
    app.whenReady().then(async () => {
      await this.initialize();
      this.createOverlayWindow();
      this.setupMenu();
      this.registerShortcuts();
      this.setupIPC();
      
      // Auto-start session if enabled
      if (this.config.autoStart) {
        await this.startSession();
      }
    });

    // App activation (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createOverlayWindow();
      }
    });

    // App will quit
    app.on('will-quit', () => {
      this.cleanup();
    });

    // All windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  createOverlayWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width: Math.min(450, Math.floor(width * 0.4)),
      height: Math.min(400, Math.floor(height * 0.35)),
      x: 50,
      y: 50,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true
      }
    });

    this.overlayWindow.loadFile(path.join(__dirname, 'index.html'));
    this.overlayWindow.hide();

    // Handle window events
    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });

    this.overlayWindow.on('show', () => {
      this.overlayWindow.webContents.send('overlay-shown');
    });

    this.overlayWindow.on('hide', () => {
      this.overlayWindow.webContents.send('overlay-hidden');
    });

    // Prevent window from being captured in screen recordings
    if (process.platform === 'darwin') {
      this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
  }

  setupMenu() {
    const template = [
      {
        label: 'Echo',
        submenu: [
          {
            label: 'Toggle Overlay',
            accelerator: 'Alt+Shift+E',
            click: () => this.toggleOverlay()
          },
          {
            label: 'Start Session',
            accelerator: 'Alt+Shift+R',
            click: () => this.startSession()
          },
          {
            label: 'Stop Session',
            accelerator: 'Alt+Shift+T',
            click: () => this.stopSession()
          },
          { type: 'separator' },
          {
            label: 'Settings',
            click: () => this.showSettings()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Stealth Mode',
            accelerator: 'Alt+Shift+M',
            click: () => this.toggleStealthMode()
          },
          {
            label: 'Show Hotkeys',
            accelerator: 'Alt+Shift+?',
            click: () => this.showHotkeys()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Echo',
            click: () => this.showAbout()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  registerShortcuts() {
    // Toggle overlay visibility
    globalShortcut.register('Alt+Shift+E', () => {
      this.toggleOverlay();
    });

    // Request suggestions
    globalShortcut.register('Alt+Shift+S', () => {
      this.requestSuggestions();
    });

    // Web lookup
    globalShortcut.register('Alt+Shift+W', () => {
      this.performWebLookup();
    });

    // Show hotkeys
    globalShortcut.register('Alt+Shift+?', () => {
      this.showHotkeys();
    });

    // Toggle stealth mode
    globalShortcut.register('Alt+Shift+M', () => {
      this.toggleStealthMode();
    });

    // Start/stop session
    globalShortcut.register('Alt+Shift+R', () => {
      this.startSession();
    });

    globalShortcut.register('Alt+Shift+T', () => {
      this.stopSession();
    });
  }

  setupIPC() {
    // Handle suggestion requests
    ipcMain.handle('fetch-suggestions', async (_, context, options) => {
      try {
        const suggestions = await LLMService.getSuggestions(context, {
          ...options,
          sessionId: this.currentSession?.id
        });
        return suggestions;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }
    });

    // Handle transcript requests
    ipcMain.handle('get-transcript', async (_, sessionId) => {
      try {
        return await ASRService.getSessionTranscripts(sessionId || this.currentSession?.id);
      } catch (error) {
        console.error('Error getting transcript:', error);
        return [];
      }
    });

    // Handle session management
    ipcMain.handle('start-session', async (_, options) => {
      return await this.startSession(options);
    });

    ipcMain.handle('stop-session', async () => {
      return await this.stopSession();
    });

    // Handle settings
    ipcMain.handle('get-settings', () => {
      return this.config;
    });

    ipcMain.handle('update-settings', (_, newConfig) => {
      this.config = { ...this.config, ...newConfig };
      return this.config;
    });

    // Handle profile management
    ipcMain.handle('save-profile', async (_, profileData) => {
      try {
        await DatabaseService.saveProfile(profileData);
        return true;
      } catch (error) {
        console.error('Error saving profile:', error);
        return false;
      }
    });

    ipcMain.handle('get-profile', async () => {
      try {
        return await DatabaseService.getProfile();
      } catch (error) {
        console.error('Error getting profile:', error);
        return null;
      }
    });
  }

  async startSession(options = {}) {
    if (this.currentSession) {
      await this.stopSession();
    }

    try {
      // Create new session
      const sessionId = await DatabaseService.createSession(
        options.type || 'interview',
        options.mode || 'overlay',
        options.title || 'Echo Session',
        options.sourceApp || 'desktop'
      );

      this.currentSession = {
        id: sessionId,
        startTime: new Date(),
        type: options.type || 'interview',
        mode: options.mode || 'overlay'
      };

      // Start ASR session
      await ASRService.startSession(sessionId, options);

      // Notify overlay
      if (this.overlayWindow) {
        this.overlayWindow.webContents.send('session-started', this.currentSession);
      }

      console.log('Session started:', sessionId);
      return this.currentSession;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async stopSession() {
    if (!this.currentSession) return;

    try {
      // Stop ASR session
      await ASRService.stopSession();

      // Update session end time
      await DatabaseService.updateSession(this.currentSession.id, {
        ended_at: new Date().toISOString()
      });

      // Generate session summary
      const summary = await LLMService.generateSessionSummary(this.currentSession.id);

      // Notify overlay
      if (this.overlayWindow) {
        this.overlayWindow.webContents.send('session-stopped', {
          sessionId: this.currentSession.id,
          summary
        });
      }

      console.log('Session stopped:', this.currentSession.id);
      this.currentSession = null;
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }

  async requestSuggestions() {
    if (!this.overlayWindow) return;

    try {
      // Show loading state
      this.overlayWindow.webContents.send('loading-suggestions');

      // Get current transcript
      const context = await ASRService.getPartialTranscript();
      
      if (!context || context.trim().length < 10) {
        this.overlayWindow.webContents.send('suggestions', [], {
          message: 'Not enough context for suggestions. Keep talking!'
        });
        return;
      }

      // Get suggestions from LLM
      const suggestions = await LLMService.getSuggestions(context, {
        pipeline: this.currentSession?.type || 'interview',
        sessionId: this.currentSession?.id,
        redactPII: true
      });

      // Send to overlay
      this.overlayWindow.webContents.send('suggestions', suggestions, {
        question: this.extractCurrentQuestion(context),
        timestamp: new Date()
      });

      // Show overlay
      this.overlayWindow.show();
    } catch (error) {
      console.error('Error requesting suggestions:', error);
      this.overlayWindow.webContents.send('suggestions', [], {
        error: 'Failed to generate suggestions'
      });
    }
  }

  extractCurrentQuestion(transcript) {
    // Simple question extraction logic
    const sentences = transcript.split(/[.!?]+/);
    const lastSentence = sentences[sentences.length - 1].trim();
    
    if (lastSentence.includes('?')) {
      return lastSentence;
    }
    
    // Look for question patterns
    const questionPatterns = [
      /tell me about/i,
      /what is/i,
      /how do/i,
      /can you/i,
      /would you/i
    ];
    
    for (const pattern of questionPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const startIndex = match.index;
        const questionPart = transcript.substring(startIndex);
        const questionEnd = questionPart.search(/[.!?]/);
        return questionEnd > 0 ? questionPart.substring(0, questionEnd + 1) : questionPart;
      }
    }
    
    return null;
  }

  async performWebLookup() {
    if (!this.overlayWindow) return;

    try {
      const context = await ASRService.getPartialTranscript();
      
      this.overlayWindow.webContents.send('web-lookup', {
        context,
        timestamp: new Date()
      });
      
      this.overlayWindow.show();
    } catch (error) {
      console.error('Error performing web lookup:', error);
    }
  }

  toggleOverlay() {
    if (!this.overlayWindow) return;

    if (this.overlayWindow.isVisible()) {
      this.overlayWindow.hide();
    } else {
      this.overlayWindow.show();
    }
  }

  toggleStealthMode() {
    this.config.stealthMode = !this.config.stealthMode;
    
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send('toggle-stealth', this.config.stealthMode);
    }
  }

  showHotkeys() {
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send('show-hotkeys');
      this.overlayWindow.show();
    }
  }

  async showSettings() {
    // In a full implementation, this would open a settings window
    const result = await dialog.showMessageBox(this.overlayWindow, {
      type: 'info',
      title: 'Echo Settings',
      message: 'Settings panel coming soon!',
      detail: 'Current configuration:\n' +
               `Model: ${this.config.modelSize}\n` +
               `Provider: ${this.config.provider}\n` +
               `Stealth Mode: ${this.config.stealthMode ? 'On' : 'Off'}`
    });
  }

  showAbout() {
    dialog.showMessageBox(this.overlayWindow, {
      type: 'info',
      title: 'About Echo',
      message: 'Echo - AI Interview, Meeting & Workplace Copilot',
      detail: 'Version 1.0.0\n\nA privacy-first desktop copilot that helps you perform better in interviews, meetings, and workplace conversations.'
    });
  }

  handleTranscript(transcriptData) {
    // Forward transcript to overlay for real-time updates
    if (this.overlayWindow && this.overlayWindow.isVisible()) {
      this.overlayWindow.webContents.send('transcript-update', transcriptData);
    }

    // Emit transcript event for other components
    this.emit('transcript', transcriptData);
  }

  async cleanup() {
    try {
      // Stop current session
      if (this.currentSession) {
        await this.stopSession();
      }

      // Cleanup services
      await ASRService.cleanup();
      await LLMService.cleanup();
      await DatabaseService.close();

      // Unregister shortcuts
      globalShortcut.unregisterAll();

      console.log('Echo application cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Create and start the application
const echoApp = new EchoApp();

// Export for testing
module.exports = echoApp;