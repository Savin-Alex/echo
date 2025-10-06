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
  }

  async initialize(modelSize = 'tiny') {
    try {
      console.log('Initializing ASR service with model:', modelSize);
      this.modelSize = modelSize;
      
      // Initialize Whisper pipeline (placeholder for now)
      console.log('Initializing Whisper pipeline (placeholder)');
      this.pipeline = { model: `whisper-${modelSize}` };
      
      this.isInitialized = true;
      console.log('ASR service initialized successfully');
      
      // Initialize database
      await DatabaseService.initialize();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ASR service:', error);
      throw error;
    }
  }

  async startSession(sessionId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('ASR service not initialized');
    }

    if (this.isRecording) {
      await this.stopSession();
    }

    this.currentSessionId = sessionId;
    this.isRecording = true;
    this.audioBuffer = [];
    this.lastTranscript = '';

    console.log('Starting ASR session:', sessionId);

    // Start audio capture
    await this.startAudioCapture(options);
    
    // Start streaming transcription
    this.startStreamingTranscription();

    return true;
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

      // Transcribe audio chunk
      const result = await this.transcribeAudio(audioData);
      
      if (result && result.text && result.text.trim()) {
        await this.handleTranscript(result);
      }

      // Clear processed buffer
      this.audioBuffer = [];
    } catch (error) {
      console.error('Error processing audio buffer:', error);
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
      console.log('New transcript:', text);
      
      // Save to database
      if (this.currentSessionId) {
        await DatabaseService.addTranscript(
          this.currentSessionId,
          'user', // Speaker identification would be more sophisticated
          text,
          confidence
        );
      }

      // Emit event for real-time updates
      this.emit('transcript', {
        sessionId: this.currentSessionId,
        text,
        confidence,
        timestamp: new Date()
      });

      this.lastTranscript = text;
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
      throw new Error('Cannot switch model during active session');
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