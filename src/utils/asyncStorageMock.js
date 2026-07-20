const memoryStore = {};

const isWeb = typeof window !== 'undefined' && !!window.localStorage;

const asyncStorageMock = {
  getItem: async (key) => {
    if (isWeb) {
      return window.localStorage.getItem(key);
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  },
  setItem: async (key, value) => {
    if (isWeb) {
      window.localStorage.setItem(key, value);
      return;
    }
    memoryStore[key] = String(value);
  },
  removeItem: async (key) => {
    if (isWeb) {
      window.localStorage.removeItem(key);
      return;
    }
    delete memoryStore[key];
  },
  clear: async () => {
    if (isWeb) {
      window.localStorage.clear();
      return;
    }
    for (const key in memoryStore) {
      if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
        delete memoryStore[key];
      }
    }
  },
  getAllKeys: async () => {
    if (isWeb) {
      return Object.keys(window.localStorage);
    }
    return Object.keys(memoryStore);
  },
  multiGet: async (keys) => {
    const pairs = [];
    for (const key of keys) {
      pairs.push([key, await asyncStorageMock.getItem(key)]);
    }
    return pairs;
  },
  multiSet: async (keyValuePairs) => {
    for (const [key, value] of keyValuePairs) {
      await asyncStorageMock.setItem(key, value);
    }
  },
  multiRemove: async (keys) => {
    for (const key of keys) {
      await asyncStorageMock.removeItem(key);
    }
  },
};

asyncStorageMock.default = asyncStorageMock;
module.exports = asyncStorageMock;
