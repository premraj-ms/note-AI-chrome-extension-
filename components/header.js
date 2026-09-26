// Header Component: Handles Note / AI tab toggle and settings icon button

import { StorageService } from "./storage.js";

export function initHeader({ onTabChange, onOpenSettings }) {
  const container = document.getElementById("header-container");
  if (!container) return;

  container.innerHTML = `
    <header class="sidebar-header">
      <div class="header-left-spacer"></div>
      
      <!-- Centered Page Toggle -->
      <div class="page-toggle-container">
        <button id="toggle-note" class="toggle-btn" type="button" title="Notes">
          <svg class="toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>Note</span>
        </button>
        <button id="toggle-ai" class="toggle-btn active" type="button" title="AI Assistant">
          <svg class="toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
          </svg>
          <span>AI</span>
        </button>
      </div>

      <!-- Right Settings Button -->
      <button id="btn-open-settings" class="icon-btn" title="Settings" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </header>
  `;

  const toggleNote = document.getElementById("toggle-note");
  const toggleAi = document.getElementById("toggle-ai");
  const btnOpenSettings = document.getElementById("btn-open-settings");

  function setActiveTabUI(tab) {
    if (tab === "note") {
      toggleNote.classList.add("active");
      toggleAi.classList.remove("active");
    } else {
      toggleAi.classList.add("active");
      toggleNote.classList.remove("active");
    }
  }

  toggleNote.addEventListener("click", () => {
    setActiveTabUI("note");
    StorageService.set({ activeTab: "note" });
    if (onTabChange) onTabChange("note");
  });

  toggleAi.addEventListener("click", () => {
    setActiveTabUI("ai");
    StorageService.set({ activeTab: "ai" });
    if (onTabChange) onTabChange("ai");
  });

  if (btnOpenSettings && onOpenSettings) {
    btnOpenSettings.addEventListener("click", onOpenSettings);
  }

  return {
    setActiveTab: setActiveTabUI
  };
}
