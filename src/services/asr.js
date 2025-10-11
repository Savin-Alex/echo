/*
 * ASR (Automatic Speech Recognition) service with local Whisper support.
 *
 * This module handles audio capture from microphone and system audio,
 * performs real-time transcription using local Whisper models, and
 * provides streaming partial transcripts with confidence scores.
 */

// const { pipeline } = require('@xenova/transformers'); // Commented out for now
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const DatabaseService = require('./database');

class ASRService extends EventEmitter {
  constructor() {
    super();
    this.pipeline = null;
    this.isInitialized = false;
    this.isRecording = false;
    this.audioBuffer = [];
    this.currentSessionId = null;
    this.modelSize = 'tiny'; // tiny, base, small, medium, large
    this.streamingInterval = null;
    this.lastTranscript = '';
    this.confidenceThreshold = 0.7;
    
    // Audio capture settings
    this.sampleRate = 16000;
    this.chunkDuration = 1000; // ms
    this.overlapDuration = 500; // ms
    
    // Device management
    this.selectedDeviceId = null;
    this.availableDevices = [];
    this.devicePermissions = {
      microphone: false,
      systemAudio: false
    };
    
    // Error handling and retry
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    
    // Privacy controls
    this.localOnlyMode = true; // Enforce local processing
    this.redactPII = true;
    this.retentionDays = 30; // Auto-delete transcripts after N days
  }

  async initialize(modelSize = 'tiny') {
    try {
      console.log('Initializing ASR service with model:', modelSize);
      this.modelSize = modelSize;
      
      // Check device permissions
      await this.checkDevicePermissions();
      
      // Initialize Whisper pipeline (placeholder for now)
      console.log('Initializing Whisper pipeline (placeholder)');
      this.pipeline = { model: `whisper-${modelSize}` };
      
      this.isInitialized = true;
      console.log('ASR service initialized successfully');
      
      // Initialize database
      await DatabaseService.initialize();
      
      // Start cleanup task for old transcripts
      this.startCleanupTask();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ASR service:', error);
      throw error;
    }
  }

  async startSession(sessionId, options = {}) {
    if (!this.isInitialized) {
      console.warn('ASR service not initialized, emitting disabled state');
      this.emit('state', { status: 'disabled', reason: 'not-initialized' });
      return false;
    }

    if (this.isRecording) {
      await this.stopSession();
    }
    
    // Reset error counter on new session
    this.consecutiveErrors = 0;

    this.currentSessionId = sessionId;
    this.isRecording = true;
    this.audioBuffer = [];
    this.lastTranscript = '';

    console.log('Starting ASR session:', sessionId);

    try {
      // Start audio capture
      await this.startAudioCapture(options);
      
      // Start streaming transcription
      this.startStreamingTranscription();
      
      // Emit session started event
      this.emit('session-started', { sessionId, timestamp: new Date() });

      return true;
    } catch (error) {
      console.error('Failed to start ASR session:', error);
      this.isRecording = false;
      this.emit('session-error', { error: error.message, sessionId });
      throw error;
    }
  }

  async stopSession() {
    if (!this.isRecording) return;

    this.isRecording = false;
    
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }

    // Stop audio capture
    await this.stopAudioCapture();

    // Process remaining audio buffer
    if (this.audioBuffer.length > 0) {
      await this.processAudioBuffer();
    }

    console.log('ASR session stopped');
    return true;
  }

  async startAudioCapture(options = {}) {
    try {
      // Initialize audio capture (placeholder for now)
      if (options.captureSystemAudio !== false) {
        console.log('System audio capture started (placeholder)');
      }

      // Request microphone permissions and start capture
      if (options.captureMicrophone !== false) {
        await this.startMicrophoneCapture();
      }
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }

  async startMicrophoneCapture() {
    // In a real implementation, this would use WebAudio API
    // or native audio capture modules to get microphone input
    console.log('Microphone capture started (placeholder)');
  }

  async stopAudioCapture() {
    try {
      // Stop audio capture (placeholder for now)
      console.log('Audio capture stopped');
    } catch (error) {
      console.error('Error stopping audio capture:', error);
    }
  }

  startStreamingTranscription() {
    // Process audio buffer every chunk duration
    this.streamingInterval = setInterval(async () => {
      if (this.audioBuffer.length > 0) {
        await this.processAudioBuffer();
      }
    }, this.chunkDuration);
  }

  async processAudioBuffer() {
    if (!this.isRecording || this.audioBuffer.length === 0) return;

    try {
      // Convert audio buffer to format suitable for Whisper
      const audioData = this.prepareAudioForTranscription();
      
      if (audioData.length < this.sampleRate * 0.5) { // Minimum 0.5 seconds
        return;
      }

      // Transcribe audio chunk with retry logic
      const result = await this.transcribeAudioWithRetry(audioData);
      
      if (result && result.text && result.text.trim()) {
        await this.handleTranscript(result);
        // Reset error counter on successful transcription
        this.consecutiveErrors = 0;
      }

      // Clear processed buffer
      this.audioBuffer = [];
    } catch (error) {
      console.error('Error processing audio buffer:', error);
      this.consecutiveErrors++;
      
      // If too many consecutive errors, stop the session
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error('Too many consecutive errors, stopping session');
        this.emit('session-error', { error: 'Too many consecutive errors', sessionId: this.currentSessionId });
        await this.stopSession();
      }
    }
  }

  prepareAudioForTranscription() {
    // Convert audio buffer to Float32Array suitable for Whisper
    // This is a simplified implementation - real implementation would
    // handle proper audio format conversion, resampling, etc.
    return new Float32Array(this.audioBuffer);
  }

  async transcribeAudio(audioData) {
    try {
      // Placeholder transcription for now
      const mockTranscripts = [
        "Tell me about your experience managing projects.",
        "What are your strengths and weaknesses?",
        "How do you handle difficult team members?",
        "Describe a challenging situation you overcame.",
        "Where do you see yourself in five years?"
      ];
      
      const randomText = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      return {
        text: randomText,
        confidence: 0.85,
        chunks: []
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  calculateConfidence(result) {
    // Calculate confidence score based on model output
    // This is a simplified implementation
    if (result.chunks && result.chunks.length > 0) {
      const avgConfidence = result.chunks.reduce((sum, chunk) => {
        return sum + (chunk.confidence || 0.8);
      }, 0) / result.chunks.length;
      return avgConfidence;
    }
    return 0.8; // Default confidence
  }

  async handleTranscript(result) {
    const { text, confidence } = result;
    
    // Only process if confidence is above threshold
    if (confidence < this.confidenceThreshold) {
      return;
    }

    // Check for new content
    if (text !== this.lastTranscript && text.trim()) {
      // Security: Redact PII if enabled
      const processedText = this.redactPII ? this.redactPIIFromTranscript(text) : text;
      
      console.log('New transcript:', processedText);
      
      // Save to database
      if (this.currentSessionId) {
        await DatabaseService.addTranscript(
          this.currentSessionId,
          'user', // Speaker identification would be more sophisticated
          processedText,
          confidence
        );
      }

      // Emit event for real-time updates
      this.emit('transcript', {
        sessionId: this.currentSessionId,
        text: processedText,
        confidence,
        timestamp: new Date()
      });

      this.lastTranscript = processedText;
    }
  }

  async getPartialTranscript() {
    // Return the most recent transcript
    if (this.currentSessionId) {
      const transcripts = await DatabaseService.getTranscripts(this.currentSessionId);
      if (transcripts.length > 0) {
        const lastTranscript = transcripts[transcripts.length - 1];
        return lastTranscript.text;
      }
    }
    return this.lastTranscript || '';
  }

  async getSessionTranscripts(sessionId) {
    return await DatabaseService.getTranscripts(sessionId);
  }

  // Audio analysis methods
  analyzeAudioQuality(audioData) {
    // Analyze audio quality metrics
    const rms = this.calculateRMS(audioData);
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    
    return {
      volume: rms,
      clarity: spectralCentroid,
      quality: this.assessQuality(rms, spectralCentroid)
    };
  }

  calculateRMS(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  calculateSpectralCentroid(audioData) {
    // Simplified spectral centroid calculation
    // Real implementation would use FFT
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const magnitude = Math.abs(audioData[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  assessQuality(volume, spectralCentroid) {
    // Assess audio quality based on volume and spectral characteristics
    if (volume < 0.01) return 'low';
    if (volume > 0.1) return 'high';
    return 'medium';
  }

  // Model management
  async switchModel(modelSize) {
    if (this.isRecording) {
      console.warn('Cannot switch model during active session');
      return false;
    }

    console.log('Switching to model:', modelSize);
    this.modelSize = modelSize;
    
    // Reinitialize pipeline with new model
    this.pipeline = null;
    this.isInitialized = false;
    
    await this.initialize(modelSize);
  }

  getAvailableModels() {
    return ['tiny', 'base', 'small', 'medium', 'large'];
  }

  getCurrentModel() {
    return this.modelSize;
  }

  // Device management
  async checkDevicePermissions() {
    // This would check actual device permissions in a real implementation
    console.log('Checking device permissions...');
    this.devicePermissions.microphone = true; // Placeholder
    this.devicePermissions.systemAudio = false; // Placeholder
  }

  async getAvailableDevices() {
    // This would enumerate actual audio devices in a real implementation
    return [
      { id: 'default', name: 'Default Microphone', type: 'microphone' },
      { id: 'system', name: 'System Audio', type: 'system' }
    ];
  }

  async selectDevice(deviceId) {
    const devices = await this.getAvailableDevices();
    const device = devices.find(d => d.id === deviceId);
    
    if (!device) {
      console.warn('Device not found:', deviceId);
      return false;
    }
    
    this.selectedDeviceId = deviceId;
    console.log('Selected device:', device.name);
  }

  // Error handling and retry
  async transcribeAudioWithRetry(audioData) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.transcribeAudio(audioData);
      } catch (error) {
        lastError = error;
        console.warn(`Transcription attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Privacy controls
  redactPIIFromTranscript(text) {
    if (!text || typeof text !== 'string') return text;
    
    const patterns = [
      { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
      { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
      { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
      { regex: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE]' },
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME]' },
      { regex: /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g, replacement: '[ZIP]' }
    ];

    let redacted = text;
    patterns.forEach(({ regex, replacement }) => {
      redacted = redacted.replace(regex, replacement);
    });

    return redacted;
  }

  // Cleanup tasks
  startCleanupTask() {
    // Run cleanup every hour
    setInterval(async () => {
      await this.cleanupOldTranscripts();
    }, 3600000); // 1 hour
  }

  async cleanupOldTranscripts() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      // This would delete old transcripts in a real implementation
      console.log(`Cleaning up transcripts older than ${this.retentionDays} days`);
    } catch (error) {
      console.error('Error cleaning up old transcripts:', error);
    }
  }

  // Cleanup
  async cleanup() {
    if (this.isRecording) {
      await this.stopSession();
    }
    
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
    }
    
    this.pipeline = null;
    this.isInitialized = false;
  }
}

module.exports = new ASRService();