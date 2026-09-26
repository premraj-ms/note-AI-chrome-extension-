// Root Sidebar Controller: Coordinates Header, Views, Settings & Storage

import { StorageService } from "./components/storage.js";
import { initHeader } from "./components/header.js";
import { initNoteView } from "./components/note-view.js";
import { initAiView } from "./components/ai-view.js";
import { initSettingsView } from "./components/settings-view.js";
import { initAboutView } from "./components/about-view.js";

document.addEventListener("DOMContentLoaded", async () => {
  let activeTab = "note";
  let lastMainTab = "note";

  // 1. Initialize Views
  const noteView = initNoteView();
  const aiView = initAiView({
    onOpenSettings: () => switchView("settings")
  });

  let settingsView = null;
  let aboutView = null;
  let header = null;

  function switchView(tab) {
    if (tab === "note" || tab === "ai") {
      lastMainTab = tab;
      activeTab = tab;
      StorageService.set({ activeTab: tab });
    }

    const noteContainer = document.getElementById("note-view-container");
    const aiContainer = document.getElementById("ai-view-container");
    const settingsContainer = document.getElementById("settings-view-container");
    const aboutContainer = document.getElementById("about-view-container");

    const containers = [
      { id: "note", el: noteContainer, view: noteView },
      { id: "ai", el: aiContainer, view: aiView },
      { id: "settings", el: settingsContainer, view: settingsView },
      { id: "about", el: aboutContainer, view: aboutView }
    ];

    containers.forEach(c => {
      if (c.el) {
        if (c.id === tab) {
          c.el.classList.add("active");
          c.el.style.display = "flex";
          if (c.view) c.view.show();
        } else {
          c.el.classList.remove("active");
          c.el.style.display = "none";
          if (c.view) c.view.hide();
        }
      }
    });

    if (header) {
      // Don't change header active tab if we are in settings or about
      if (tab === "note" || tab === "ai") {
        header.setActiveTab(tab);
      }
    }
  }

  // 2. Initialize Settings View
  settingsView = initSettingsView({
    onClose: () => {
      const returnTab = (lastMainTab && lastMainTab !== "settings") ? lastMainTab : "note";
      switchView(returnTab);
    },
    onOpenAbout: () => {
      switchView("about");
    }
  });

  // 3. Initialize About View
  aboutView = initAboutView({
    onClose: () => switchView("settings") // Go back to settings from about
  });

  // 4. Initialize Header
  header = initHeader({
    onTabChange: (tab) => switchView(tab),
    onOpenSettings: () => {
      switchView("settings");
    }
  });

  // 4. Restore saved active tab & settings on load
  const data = await StorageService.get({ activeTab: "note", fontSize: "14px", primaryColor: "#ff6b00" });
  if (data.primaryColor) {
    document.documentElement.style.setProperty("--primary-color", data.primaryColor);
  }
  if (data.fontSize) {
    document.documentElement.style.setProperty("--editor-font-size", data.fontSize);
  }

  let initialTab = (data.activeTab && data.activeTab !== "settings") ? data.activeTab : "note";
  lastMainTab = initialTab;
  switchView(initialTab);

  // 5. Listen for messages from parent content script
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SWITCH_TAB" && event.data.tab) {
      switchView(event.data.tab);
    }
  });
});

