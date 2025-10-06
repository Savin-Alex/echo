/*
 * Simple test to verify Jest setup is working
 */

describe('Jest Setup Test', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(typeof global.testUtils.createMockAudioData).toBe('function');
    expect(typeof global.testUtils.createMockContext).toBe('function');
  });

  test('should create mock audio data', () => {
    const audioData = global.testUtils.createMockAudioData(1000);
    expect(audioData).toBeInstanceOf(Float32Array);
    expect(audioData.length).toBe(16000); // 1 second at 16kHz
  });

  test('should create mock context', () => {
    const context = global.testUtils.createMockContext();
    expect(context).toHaveProperty('transcript');
    expect(context).toHaveProperty('currentQuestion');
    expect(context).toHaveProperty('resume');
    expect(context).toHaveProperty('jobDescription');
  });
});
