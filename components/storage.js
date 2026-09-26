// Storage Service: Unified chrome.storage.local helper

export const DEFAULT_SETTINGS = {
  activeTab: "ai",
  primaryColor: "#ff6b00",
  activeProvider: "openai",
  llmSettings: {
    openai: { apiKey: "", model: "gpt-4o" },
    claude: { apiKey: "", model: "claude-3-5-sonnet-20241022" },
    groq: { apiKey: "", model: "llama-3.3-70b-versatile" }
  }
};

export const StorageService = {
  async get(keys = DEFAULT_SETTINGS) {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, (res) => resolve(res || DEFAULT_SETTINGS));
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  },

  async set(items) {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(items, () => resolve());
      } else {
        resolve();
      }
    });
  }
};
