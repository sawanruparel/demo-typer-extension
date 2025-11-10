/**
 * Jest Setup File
 * Sets up the testing environment for the Demo Typer Extension
 */

// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const mockData = {
          typingSpeed: 50,
          minDelay: 50,
          maxDelay: 150,
          snippets: {}
        };
        callback(mockData);
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      })
    },
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      })
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    lastError: null
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([{ id: 1, active: true }]);
    }),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

