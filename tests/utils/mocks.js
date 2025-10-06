/*
 * Mock utilities for Echo service tests
 */

// Mock Whisper pipeline
const mockWhisperPipeline = {
  model: 'whisper-tiny',
  transcribe: jest.fn().mockResolvedValue({
    text: 'Mock transcription result',
    confidence: 0.85,
    chunks: [
      { text: 'Mock', confidence: 0.9 },
      { text: 'transcription', confidence: 0.8 },
      { text: 'result', confidence: 0.85 }
    ]
  })
};

// Mock LLM responses
const mockLLMResponses = {
  openai: "• Highlight your relevant experience with specific examples\n• Connect your skills to the job requirements\n• Ask clarifying questions about the role\n• Show enthusiasm for the opportunity",
  anthropic: "• Provide concrete examples from your past work\n• Demonstrate problem-solving abilities\n• Show how you've grown and learned\n• Express genuine interest in the company",
  google: "• Use the STAR method (Situation, Task, Action, Result)\n• Quantify your achievements with metrics\n• Show cultural fit and values alignment\n• End with a thoughtful question about the role"
};

// Mock audio capture
const mockAudioCapture = {
  start: jest.fn().mockResolvedValue(true),
  stop: jest.fn().mockResolvedValue(true),
  isRecording: false,
  audioBuffer: []
};

// Mock database operations
const mockDatabaseOperations = {
  createSession: jest.fn().mockReturnValue(1),
  getSession: jest.fn().mockReturnValue({
    id: 1,
    type: 'interview',
    mode: 'stealth',
    title: 'Test Session',
    started_at: new Date().toISOString(),
    ended_at: null
  }),
  addTranscript: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
  getTranscripts: jest.fn().mockReturnValue([
    { id: 1, text: 'Test transcript', confidence: 0.85, timestamp: new Date().toISOString() }
  ]),
  addSuggestion: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
  getSuggestions: jest.fn().mockReturnValue([
    { id: 1, content: 'Test suggestion', channel: 'interview' }
  ]),
  saveProfile: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
  getProfile: jest.fn().mockReturnValue({
    resume: 'Mock resume content',
    jobDescription: 'Mock job description',
    role: 'Software Engineer',
    industry: 'Technology'
  })
};

// Mock Electron IPC
const mockIpcRenderer = {
  invoke: jest.fn().mockResolvedValue({ success: true }),
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn()
};

// Mock system audio capture
const mockSystemAudio = {
  getDevices: jest.fn().mockResolvedValue([
    { id: 'device1', name: 'Built-in Microphone', type: 'input' },
    { id: 'device2', name: 'Built-in Speakers', type: 'output' }
  ]),
  startCapture: jest.fn().mockResolvedValue(true),
  stopCapture: jest.fn().mockResolvedValue(true),
  getAudioData: jest.fn().mockReturnValue(new Float32Array(16000).fill(0.1))
};

// Mock API responses
const mockAPIResponses = {
  openai: {
    choices: [{
      message: {
        content: mockLLMResponses.openai
      }
    }]
  },
  anthropic: {
    content: [{
      text: mockLLMResponses.anthropic
    }]
  },
  google: {
    candidates: [{
      content: {
        parts: [{
          text: mockLLMResponses.google
        }]
      }
    }]
  }
};

// Utility functions for creating test data
const createMockAudioChunk = (duration = 1000, sampleRate = 16000) => {
  const samples = sampleRate * (duration / 1000);
  const audioData = new Float32Array(samples);
  
  // Add some variation to simulate real audio
  for (let i = 0; i < samples; i++) {
    audioData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1 + Math.random() * 0.05;
  }
  
  return audioData;
};

const createMockTranscriptEvent = (text = 'Test transcript', confidence = 0.85) => ({
  sessionId: 1,
  text,
  confidence,
  timestamp: new Date()
});

const createMockSuggestionEvent = (content = 'Test suggestion', pipeline = 'interview') => ({
  sessionId: 1,
  pipeline,
  content,
  timestamp: new Date()
});

// Reset all mocks
const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset mock functions
  mockWhisperPipeline.transcribe.mockClear();
  mockAudioCapture.start.mockClear();
  mockAudioCapture.stop.mockClear();
  mockDatabaseOperations.createSession.mockClear();
  mockDatabaseOperations.getSession.mockClear();
  mockDatabaseOperations.addTranscript.mockClear();
  mockDatabaseOperations.getTranscripts.mockClear();
  mockIpcRenderer.invoke.mockClear();
  mockIpcRenderer.on.mockClear();
  mockIpcRenderer.off.mockClear();
  mockIpcRenderer.send.mockClear();
};

module.exports = {
  mockWhisperPipeline,
  mockLLMResponses,
  mockAudioCapture,
  mockDatabaseOperations,
  mockIpcRenderer,
  mockSystemAudio,
  mockAPIResponses,
  createMockAudioChunk,
  createMockTranscriptEvent,
  createMockSuggestionEvent,
  resetAllMocks
};
