/*
 * Test setup file for Echo service tests
 * 
 * This file sets up global mocks and test utilities
 * that are shared across all test files.
 */

// Global test utilities
global.testUtils = {
  // Create mock audio data
  createMockAudioData: (duration = 1000) => {
    const sampleRate = 16000;
    const samples = sampleRate * (duration / 1000);
    return new Float32Array(samples).fill(0.1);
  },
  
  // Create mock transcript data
  createMockTranscript: (text = 'Test transcript') => ({
    text,
    confidence: 0.85,
    chunks: [{ text, confidence: 0.85 }]
  }),
  
  // Create mock session data
  createMockSession: (overrides = {}) => ({
    id: 1,
    type: 'interview',
    mode: 'stealth',
    title: 'Test Session',
    source_app: 'zoom',
    started_at: new Date().toISOString(),
    ended_at: null,
    metadata: null,
    ...overrides
  }),
  
  // Create mock context data
  createMockContext: (overrides = {}) => ({
    transcript: 'Tell me about your experience with JavaScript.',
    currentQuestion: 'What are your technical strengths?',
    resume: 'Software Engineer with 5 years experience...',
    jobDescription: 'Looking for a senior JavaScript developer...',
    ...overrides
  }),
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock console methods to reduce noise in tests
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    return () => {
      Object.assign(console, originalConsole);
    };
  }
};

// Setup test database path
process.env.NODE_ENV = 'test';

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);