/**
 * Jest Setup File
 * Sets up the testing environment for the Demo Typer Extension
 */

function resolveStorageValues(keys, store) {
  if (keys == null) {
    return { ...store };
  }

  if (Array.isArray(keys)) {
    return keys.reduce((acc, key) => {
      acc[key] = store[key];
      return acc;
    }, {});
  }

  if (typeof keys === 'string') {
    return { [keys]: store[keys] };
  }

  return Object.entries(keys).reduce((acc, [key, fallback]) => {
    acc[key] = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback;
    return acc;
  }, {});
}

const localStore = {};

function makeStorageArea(store) {
  return {
    get: jest.fn((keys, callback) => {
      const result = resolveStorageValues(keys, store);
      if (typeof callback === 'function') {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((data, callback) => {
      Object.assign(store, data);
      if (typeof callback === 'function') {
        callback();
        return undefined;
      }
      return Promise.resolve();
    }),
    __setData(data) {
      Object.keys(store).forEach((key) => delete store[key]);
      Object.assign(store, data);
    },
    __getData() {
      return { ...store };
    },
    __reset() {
      Object.keys(store).forEach((key) => delete store[key]);
    }
  };
}

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
    local: makeStorageArea(localStore),
    onChanged: {
      addListener: jest.fn()
    }
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
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
      const result = [{ id: 1, active: true, url: 'https://example.com' }];
      if (typeof callback === 'function') {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    }),
    sendMessage: jest.fn(() => Promise.resolve({ ok: true }))
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve())
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
