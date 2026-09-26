// Settings View Component: Manages theme colors, LLM providers, API keys, font sizes & custom models

import { StorageService } from "./storage.js";
import { showToast } from "./toast.js";

export function initSettingsView({ onClose, onOpenAbout }) {
  const container = document.getElementById("settings-view-container");
  if (!container) return;

  container.innerHTML = `
    <section id="settings-view" class="view-panel settings-panel">
      <!-- Settings Header -->
      <div class="settings-header">
        <button id="btn-back-settings" class="back-btn" type="button" title="Back to previous view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
        <h3>Settings</h3>
        <div class="header-right-spacer"></div>
      </div>

      <!-- Settings Scroll Body -->
      <div class="settings-scroll-body">
        <!-- 1. Primary Color Customization -->
        <div class="settings-card">
          <label class="section-label">Primary Theme Color</label>
          <p class="section-desc">Choose an accent color for the extension</p>
          <div class="color-picker-group">
            <div class="color-swatches" id="color-swatches">
              <button type="button" class="swatch-btn active" data-color="#ff6b00" style="background-color: #ff6b00;" title="Orange"></button>
              <button type="button" class="swatch-btn" data-color="#2563eb" style="background-color: #2563eb;" title="Blue"></button>
              <button type="button" class="swatch-btn" data-color="#8b5cf6" style="background-color: #8b5cf6;" title="Purple"></button>
              <button type="button" class="swatch-btn" data-color="#10b981" style="background-color: #10b981;" title="Emerald"></button>
              <button type="button" class="swatch-btn" data-color="#f43f5e" style="background-color: #f43f5e;" title="Rose"></button>
              <button type="button" class="swatch-btn" data-color="#0f172a" style="background-color: #0f172a;" title="Dark Slate"></button>
            </div>
            <div class="custom-color-wrap">
              <label for="custom-color-input" class="custom-color-label">Custom:</label>
              <input type="color" id="custom-color-input" value="#ff6b00">
            </div>
          </div>
        </div>

        <!-- 2. Font Size Customization -->
        <div class="settings-card">
          <label class="section-label">Editor Font Size</label>
          <p class="section-desc">Choose text size for reading and writing notes</p>
          <div class="font-size-control" id="font-size-options">
            <button type="button" class="font-size-btn" data-size="12px">
              <span class="fs-label">Small</span>
              <span class="fs-val">12px</span>
            </button>
            <button type="button" class="font-size-btn active" data-size="14px">
              <span class="fs-label">Medium</span>
              <span class="fs-val">14px</span>
            </button>
            <button type="button" class="font-size-btn" data-size="16px">
              <span class="fs-label">Large</span>
              <span class="fs-val">16px</span>
            </button>
            <button type="button" class="font-size-btn" data-size="18px">
              <span class="fs-label">XL</span>
              <span class="fs-val">18px</span>
            </button>
          </div>
        </div>

        <!-- 3. Active Provider Selector -->
        <div class="settings-card">
          <label class="section-label">Default LLM Provider</label>
          <p class="section-desc">Select which AI service to use</p>
          <div class="provider-segmented-control" id="provider-tabs">
            <button type="button" class="provider-tab-btn active" data-provider="openai">OpenAI</button>
            <button type="button" class="provider-tab-btn" data-provider="claude">Claude</button>
            <button type="button" class="provider-tab-btn" data-provider="groq">Groq</button>
          </div>
        </div>

        <!-- 4. Provider Specific Configurations -->
        <!-- OpenAI Config -->
        <div class="settings-card provider-config-card" id="config-openai">
          <div class="provider-card-header">
            <span class="provider-badge">OpenAI</span>
          </div>
          
          <div class="form-group">
            <label for="openai-key">API Key</label>
            <div class="password-input-wrap">
              <input type="password" id="openai-key" placeholder="sk-proj-..." autocomplete="off">
              <button type="button" class="btn-toggle-eye" data-target="openai-key" title="Show/Hide Key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="openai-model">Model Name / Version</label>
            <input type="text" id="openai-model" list="openai-model-list" class="form-input" placeholder="e.g. gpt-4o, gpt-4o-mini, o1-mini...">
            <datalist id="openai-model-list">
              <option value="gpt-4o">
              <option value="gpt-4o-mini">
              <option value="gpt-4o-2024-08-06">
              <option value="o1-preview">
              <option value="o1-mini">
              <option value="gpt-4-turbo">
              <option value="gpt-3.5-turbo">
            </datalist>
          </div>
        </div>

        <!-- Claude Config -->
        <div class="settings-card provider-config-card hidden" id="config-claude">
          <div class="provider-card-header">
            <span class="provider-badge">Anthropic Claude</span>
          </div>
          
          <div class="form-group">
            <label for="claude-key">API Key</label>
            <div class="password-input-wrap">
              <input type="password" id="claude-key" placeholder="sk-ant-..." autocomplete="off">
              <button type="button" class="btn-toggle-eye" data-target="claude-key" title="Show/Hide Key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="claude-model">Model Name / Version</label>
            <input type="text" id="claude-model" list="claude-model-list" class="form-input" placeholder="e.g. claude-3-5-sonnet-20241022...">
            <datalist id="claude-model-list">
              <option value="claude-3-5-sonnet-20241022">
              <option value="claude-3-5-sonnet-latest">
              <option value="claude-3-5-haiku-20241022">
              <option value="claude-3-opus-20240229">
              <option value="claude-3-haiku-20240307">
            </datalist>
          </div>
        </div>

        <!-- Groq Config -->
        <div class="settings-card provider-config-card hidden" id="config-groq">
          <div class="provider-card-header">
            <span class="provider-badge">Groq (Ultra-Fast)</span>
          </div>
          
          <div class="form-group">
            <label for="groq-key">API Key</label>
            <div class="password-input-wrap">
              <input type="password" id="groq-key" placeholder="gsk_..." autocomplete="off">
              <button type="button" class="btn-toggle-eye" data-target="groq-key" title="Show/Hide Key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="groq-model">Model Name / Version</label>
            <input type="text" id="groq-model" list="groq-model-list" class="form-input" placeholder="e.g. llama-3.3-70b-versatile...">
            <datalist id="groq-model-list">
              <option value="llama-3.3-70b-versatile">
              <option value="llama-3.1-8b-instant">
              <option value="llama-3.2-11b-vision-preview">
              <option value="llama-3.2-3b-preview">
              <option value="mixtral-8x7b-32768">
              <option value="gemma2-9b-it">
              <option value="deepseek-r1-distill-llama-70b">
            </datalist>
          </div>
        </div>

        <!-- About Developer Link -->
        <div class="settings-card" style="margin-top: 10px; padding: 16px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; transition: background 0.2s ease;" id="btn-open-about" onmouseover="this.style.background='rgba(0,0,0,0.02)';" onmouseout="this.style.background='transparent';">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://github.com/premraj-ms.png" alt="Premraj M S" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary-color);">
            <div>
              <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main);">About Developer</h4>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-secondary);">Premraj M S</p>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <!-- Save Button -->
        <div class="settings-actions">
          <button type="button" id="btn-save-settings" class="primary-btn">Save Settings</button>
        </div>
      </div>
    </section>
  `;

  // Elements
  const settingsPanel = document.getElementById("settings-view");
  const btnBackSettings = document.getElementById("btn-back-settings");
  const colorSwatches = document.getElementById("color-swatches");
  const customColorInput = document.getElementById("custom-color-input");
  const fontSizeOptions = document.getElementById("font-size-options");
  const providerTabs = document.getElementById("provider-tabs");

  const configOpenai = document.getElementById("config-openai");
  const configClaude = document.getElementById("config-claude");
  const configGroq = document.getElementById("config-groq");

  const openaiKeyInput = document.getElementById("openai-key");
  const openaiModelInput = document.getElementById("openai-model");

  const claudeKeyInput = document.getElementById("claude-key");
  const claudeModelInput = document.getElementById("claude-model");

  const groqKeyInput = document.getElementById("groq-key");
  const groqModelInput = document.getElementById("groq-model");

  const btnSaveSettings = document.getElementById("btn-save-settings");
  const btnOpenAbout = document.getElementById("btn-open-about");

  let currentPrimaryColor = "#ff6b00";
  let currentFontSize = "14px";
  let activeProvider = "openai";

  // 1. Primary Color Management
  function applyColor(color, save = true) {
    currentPrimaryColor = color;
    document.documentElement.style.setProperty("--primary-color", color);
    document.documentElement.style.setProperty("--primary-light", hexToRgba(color, 0.12));

    document.querySelectorAll(".swatch-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.color.toLowerCase() === color.toLowerCase());
    });

    if (customColorInput) customColorInput.value = color;
    if (save) StorageService.set({ primaryColor: color });
  }

  colorSwatches.addEventListener("click", (e) => {
    const btn = e.target.closest(".swatch-btn");
    if (btn && btn.dataset.color) {
      applyColor(btn.dataset.color, true);
    }
  });

  customColorInput.addEventListener("input", (e) => {
    applyColor(e.target.value, true);
  });

  // 2. Font Size Management
  function applyFontSize(size, save = true) {
    currentFontSize = size;
    document.documentElement.style.setProperty("--editor-font-size", size);

    if (fontSizeOptions) {
      fontSizeOptions.querySelectorAll(".font-size-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.size === size);
      });
    }

    if (save) StorageService.set({ fontSize: size });
  }

  if (fontSizeOptions) {
    fontSizeOptions.addEventListener("click", (e) => {
      const btn = e.target.closest(".font-size-btn");
      if (btn && btn.dataset.size) {
        applyFontSize(btn.dataset.size, true);
      }
    });
  }

  // 3. Provider Tabs
  function selectProvider(provider, save = true) {
    activeProvider = provider;

    document.querySelectorAll(".provider-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.provider === provider);
    });

    if (configOpenai) configOpenai.classList.toggle("hidden", provider !== "openai");
    if (configClaude) configClaude.classList.toggle("hidden", provider !== "claude");
    if (configGroq) configGroq.classList.toggle("hidden", provider !== "groq");

    if (save) StorageService.set({ activeProvider: provider });
  }

  providerTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".provider-tab-btn");
    if (btn && btn.dataset.provider) {
      selectProvider(btn.dataset.provider, true);
    }
  });

  // 4. Eye Password Toggles
  container.querySelectorAll(".btn-toggle-eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });

  // 5. Save Handler
  btnSaveSettings.addEventListener("click", async () => {
    const settings = {
      primaryColor: currentPrimaryColor,
      fontSize: currentFontSize,
      activeProvider,
      openai: {
        apiKey: (openaiKeyInput?.value || "").trim(),
        model: openaiModelInput?.value || "gpt-4o"
      },
      claude: {
        apiKey: (claudeKeyInput?.value || "").trim(),
        model: claudeModelInput?.value || "claude-3-5-sonnet-20241022"
      },
      groq: {
        apiKey: (groqKeyInput?.value || "").trim(),
        model: groqModelInput?.value || "llama-3.3-70b-versatile"
      }
    };

    await StorageService.set({
      llmSettings: settings,
      primaryColor: currentPrimaryColor,
      fontSize: currentFontSize
    });
    showToast("Settings saved successfully! ✨");
  });

  // 6. Back Button
  if (btnBackSettings) {
    btnBackSettings.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClose) onClose();
    });
  }

  // 7. About Developer Button
  if (btnOpenAbout) {
    btnOpenAbout.addEventListener("click", () => {
      if (onOpenAbout) onOpenAbout();
    });
  }

  // Helper
  function hexToRgba(hex, alpha) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Initial Data Population
  async function loadData() {
    const data = await StorageService.get();
    if (data.primaryColor) applyColor(data.primaryColor, false);
    if (data.fontSize) applyFontSize(data.fontSize, false);
    if (data.activeProvider) selectProvider(data.activeProvider, false);

    const s = data.llmSettings || {};
    if (s.openai) {
      if (openaiKeyInput) openaiKeyInput.value = s.openai.apiKey || "";
      if (openaiModelInput && s.openai.model) openaiModelInput.value = s.openai.model;
    }
    if (s.claude) {
      if (claudeKeyInput) claudeKeyInput.value = s.claude.apiKey || "";
      if (claudeModelInput && s.claude.model) claudeModelInput.value = s.claude.model;
    }
    if (s.groq) {
      if (groqKeyInput) groqKeyInput.value = s.groq.apiKey || "";
      if (groqModelInput && s.groq.model) groqModelInput.value = s.groq.model;
    }
  }

  loadData();

  return {
    show: () => settingsPanel.classList.add("active"),
    hide: () => settingsPanel.classList.remove("active"),
    applyColor,
    applyFontSize
  };
}

