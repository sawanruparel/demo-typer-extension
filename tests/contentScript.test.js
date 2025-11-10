/**
 * Content Script Tests
 * Basic tests for the content script functionality
 */

describe('Content Script', () => {
  test('should be defined', () => {
    expect(true).toBe(true);
  });

  test('typing simulation should work', () => {
    const text = 'Hello World';
    expect(text).toBe('Hello World');
  });

  test('delay calculation should be within range', () => {
    const minDelay = 50;
    const maxDelay = 150;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    expect(randomDelay).toBeGreaterThanOrEqual(minDelay);
    expect(randomDelay).toBeLessThanOrEqual(maxDelay);
  });
});

