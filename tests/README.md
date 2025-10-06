# Echo Service Testing Guide

This directory contains comprehensive tests for the Echo AI Interview & Meeting Copilot services.

## Test Structure

```
tests/
├── setup.js                    # Global test setup and mocks
├── utils/
│   └── mocks.js               # Mock utilities and test data
├── services/
│   ├── asr.test.js           # ASR service unit tests
│   ├── database.test.js      # Database service unit tests
│   └── llm.test.js           # LLM service unit tests
├── integration/
│   └── echo-service.test.js  # Integration tests
└── README.md                 # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### CI Mode (for continuous integration)
```bash
npm run test:ci
```

## Test Categories

### Unit Tests
- **ASR Service**: Tests speech recognition functionality, audio processing, and transcript handling
- **Database Service**: Tests encrypted storage, session management, and data persistence
- **LLM Service**: Tests language model integration, prompt pipelines, and suggestion generation

### Integration Tests
- **Full Workflows**: Complete interview and meeting sessions
- **Service Interactions**: How services work together
- **Error Handling**: Graceful degradation and recovery
- **Performance**: Scalability and concurrent operations

## Test Coverage

The tests aim for:
- **70%+ code coverage** across all services
- **100% coverage** of critical paths (encryption, session management)
- **Comprehensive error scenarios** and edge cases
- **Real-world usage patterns** in integration tests

## Mocking Strategy

### External Dependencies
- **Electron APIs**: Mocked for Node.js environment
- **File System**: Controlled test environment
- **Database**: In-memory SQLite for testing
- **LLM APIs**: Mock responses for consistent testing

### Test Data
- **Audio Data**: Generated mock audio chunks
- **Transcripts**: Realistic conversation samples
- **User Profiles**: Complete profile data structures
- **Session Data**: Various session types and states

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
    const input = createTestData();
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template
```javascript
describe('Service Integration', () => {
  beforeEach(async () => {
    // Initialize all services
    await DatabaseService.initialize();
    await ASRService.initialize();
    await LLMService.initialize();
  });

  afterEach(async () => {
    // Cleanup all services
    await cleanupAllServices();
  });

  test('should handle complete workflow', async () => {
    // Test full user journey
  });
});
```

## Test Utilities

### Global Test Utils
- `createMockAudioData(duration)`: Generate test audio
- `createMockTranscript(text)`: Create transcript objects
- `createMockSession(overrides)`: Generate session data
- `createMockContext(overrides)`: Create context objects
- `waitFor(ms)`: Async delay utility
- `mockConsole()`: Suppress console output

### Mock Objects
- `mockWhisperPipeline`: Speech recognition mock
- `mockLLMResponses`: Language model responses
- `mockAudioCapture`: Audio input simulation
- `mockDatabaseOperations`: Database interactions

## Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Keep tests focused** on single responsibilities
4. **Clean up after each test** to avoid interference

### Assertions
1. **Test behavior, not implementation** details
2. **Use specific matchers** for better error messages
3. **Test both success and failure** cases
4. **Verify side effects** (database changes, events)

### Performance
1. **Mock expensive operations** (API calls, file I/O)
2. **Use realistic test data** sizes
3. **Test timeout scenarios** for async operations
4. **Clean up resources** properly

## Debugging Tests

### Common Issues
- **Async/await**: Ensure proper async handling
- **Mock setup**: Verify mocks are configured correctly
- **Test isolation**: Check for shared state between tests
- **Resource cleanup**: Ensure proper teardown

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
```

## Continuous Integration

### GitHub Actions
The test suite is designed to run in CI environments:
- **Node.js 18+** compatibility
- **No external dependencies** required
- **Deterministic results** with proper mocking
- **Coverage reporting** for quality gates

### Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Contributing

When adding new features:
1. **Write tests first** (TDD approach)
2. **Maintain coverage** above thresholds
3. **Update mocks** as needed
4. **Add integration tests** for new workflows
5. **Document test scenarios** in this README

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
1. **Verify Node.js version** compatibility
2. **Check dependencies** installation
3. **Ensure test directory** permissions
4. **Clean node_modules** if corrupted
