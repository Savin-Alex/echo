# Echo Service Testing Guide

## Overview

This guide explains how to test the Echo AI Interview & Meeting Copilot services. The testing setup includes unit tests, integration tests, and comprehensive test utilities.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode (for automated testing)
npm run test:ci
```

## Test Structure

```
tests/
├── setup.js                    # Global test setup and utilities
├── simple.test.js              # Basic Jest setup verification
├── utils/
│   └── mocks.js               # Mock utilities and test data
├── services/
│   ├── asr.test.js           # ASR service unit tests
│   ├── database.test.js      # Database service unit tests
│   └── llm.test.js           # LLM service unit tests
├── integration/
│   └── echo-service.test.js  # Integration tests
└── README.md                 # Detailed testing documentation
```

## Available Test Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:ci` | Run tests in CI mode |

## Testing Your Services

### 1. ASR Service Testing

The ASR (Automatic Speech Recognition) service tests cover:

- **Initialization**: Model loading and setup
- **Session Management**: Starting/stopping sessions
- **Audio Processing**: Audio buffer handling and transcription
- **Quality Analysis**: Audio quality metrics
- **Model Switching**: Dynamic model changes

**Example Test:**
```bash
npm test -- --testNamePattern="ASRService"
```

### 2. Database Service Testing

The Database service tests cover:

- **Encryption/Decryption**: AES-256 data protection
- **Session Management**: CRUD operations for sessions
- **Transcript Storage**: Audio transcription persistence
- **Profile Management**: User data handling
- **Context Caching**: Temporary data storage

**Example Test:**
```bash
npm test -- --testNamePattern="DatabaseService"
```

### 3. LLM Service Testing

The LLM (Language Model) service tests cover:

- **Provider Management**: Multiple LLM provider support
- **Prompt Pipelines**: Context-aware prompt generation
- **Suggestion Generation**: AI-powered recommendations
- **PII Redaction**: Privacy protection
- **Rate Limiting**: API usage management

**Example Test:**
```bash
npm test -- --testNamePattern="LLMService"
```

### 4. Integration Testing

Integration tests verify that services work together:

- **Complete Workflows**: Full interview/meeting sessions
- **Error Handling**: Graceful failure recovery
- **Performance**: Scalability and concurrent operations
- **Data Flow**: End-to-end data processing

**Example Test:**
```bash
npm test -- --testNamePattern="Integration"
```

## Manual Testing

### Testing ASR Service

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Test audio capture:**
   - Grant microphone permissions when prompted
   - Start a session using `Alt+Shift+R`
   - Speak into your microphone
   - Check console for transcript output

3. **Test different models:**
   - Switch between tiny, base, small models
   - Compare accuracy and performance

### Testing LLM Service

1. **Configure API keys:**
   - Set up OpenAI, Anthropic, or Google API keys
   - Test different providers

2. **Test suggestion generation:**
   - Start an interview session
   - Press `Alt+Shift+S` for suggestions
   - Verify context-aware responses

3. **Test privacy features:**
   - Enable PII redaction
   - Verify sensitive data is masked

### Testing Database Service

1. **Test data persistence:**
   - Create sessions and add transcripts
   - Restart application
   - Verify data is still available

2. **Test encryption:**
   - Save profile with sensitive data
   - Check database file is encrypted

## Test Utilities

### Global Test Utils

Available in all tests via `global.testUtils`:

```javascript
// Create mock audio data
const audioData = global.testUtils.createMockAudioData(1000);

// Create mock transcript
const transcript = global.testUtils.createMockTranscript('Hello world');

// Create mock session
const session = global.testUtils.createMockSession({
  type: 'interview',
  title: 'Custom Session'
});

// Create mock context
const context = global.testUtils.createMockContext({
  transcript: 'Custom transcript text'
});

// Wait for async operations
await global.testUtils.waitFor(500);

// Mock console output
const restoreConsole = global.testUtils.mockConsole();
// ... run tests ...
restoreConsole();
```

### Mock Objects

Available in test files:

```javascript
const { 
  mockWhisperPipeline,
  mockLLMResponses,
  mockAudioCapture,
  createMockAudioChunk,
  createMockTranscriptEvent,
  resetAllMocks
} = require('../utils/mocks');
```

## Writing New Tests

### Unit Test Template

```javascript
describe('ServiceName', () => {
  let restoreConsole;

  beforeEach(() => {
    restoreConsole = global.testUtils.mockConsole();
    // Setup test state
  });

  afterEach(() => {
    restoreConsole();
    // Cleanup
  });

  test('should handle specific scenario', async () => {
    // Arrange
    const input = global.testUtils.createMockContext();
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result).toHaveProperty('expectedProperty');
  });
});
```

### Integration Test Template

```javascript
describe('Service Integration', () => {
  beforeEach(async () => {
    // Initialize services (if needed)
    await DatabaseService.initialize();
  });

  afterEach(async () => {
    // Cleanup services
    await cleanupServices();
  });

  test('should handle complete workflow', async () => {
    // Test full user journey
    const sessionId = DatabaseService.createSession('interview', 'stealth');
    
    // ... test steps ...
    
    expect(results).toBeDefined();
  });
});
```

## Debugging Tests

### Common Issues

1. **Async/Await Problems:**
   ```javascript
   // Wrong
   test('async test', () => {
     service.asyncMethod().then(result => {
       expect(result).toBeDefined();
     });
   });
   
   // Correct
   test('async test', async () => {
     const result = await service.asyncMethod();
     expect(result).toBeDefined();
   });
   ```

2. **Mock Setup:**
   ```javascript
   // Ensure mocks are properly configured
   beforeEach(() => {
     jest.clearAllMocks();
     // Setup specific mocks
   });
   ```

3. **Test Isolation:**
   ```javascript
   // Clean up after each test
   afterEach(() => {
     // Reset service state
     service.reset();
     // Clear mocks
     jest.clearAllMocks();
   });
   ```

### Debug Commands

```bash
# Run specific test file
npm test -- asr.test.js

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="should handle audio processing"

# Debug mode
npm test -- --detectOpenHandles --forceExit

# Run tests without coverage
npm test -- --coverage=false
```

## Performance Testing

### Load Testing

```javascript
test('should handle multiple concurrent sessions', async () => {
  const sessionIds = [];
  
  // Create multiple sessions
  for (let i = 0; i < 10; i++) {
    const sessionId = DatabaseService.createSession('interview', 'stealth');
    sessionIds.push(sessionId);
  }
  
  // Process all sessions
  const promises = sessionIds.map(id => processSession(id));
  const results = await Promise.all(promises);
  
  expect(results).toHaveLength(10);
});
```

### Memory Testing

```javascript
test('should not leak memory with large datasets', async () => {
  const initialMemory = process.memoryUsage();
  
  // Process large dataset
  for (let i = 0; i < 1000; i++) {
    await processLargeDataset();
  }
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  // Memory increase should be reasonable
  expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
});
```

## Continuous Integration

### GitHub Actions

The test suite is designed to run in CI environments:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### Coverage Requirements

Current coverage thresholds:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## Troubleshooting

### Test Failures

1. **Check mock setup** in beforeEach
2. **Verify async/await** usage
3. **Ensure proper cleanup** in afterEach
4. **Check test data** validity

### Performance Issues

1. **Reduce test data** size if needed
2. **Mock expensive operations**
3. **Use test.only()** to isolate issues
4. **Check for memory leaks** in cleanup

### Environment Issues

1. **Verify Node.js version** compatibility (18+)
2. **Check dependencies** installation
3. **Ensure test directory** permissions
4. **Clean node_modules** if corrupted

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Maintain coverage** above thresholds
3. **Update mocks** as needed
4. **Add integration tests** for new workflows
5. **Document test scenarios** in this guide

## Support

For testing issues:
- Check the [Jest documentation](https://jestjs.io/docs/getting-started)
- Review test examples in the `tests/` directory
- Check console output for detailed error messages
- Ensure all dependencies are properly installed
