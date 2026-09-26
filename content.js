// Content Script: Injects the resizable sidebar and reflows the webpage

(function () {
  if (window.__SIDEBAR_INJECTED__) return;
  window.__SIDEBAR_INJECTED__ = true;

  const SIDEBAR_ID = "sidebar-extension-root";
  const TOGGLE_BTN_ID = "sidebar-extension-toggle-btn";
  const RESIZER_ID = "sidebar-extension-resizer";
  const STYLE_ID = "sidebar-extension-reflow-style";

  let isSidebarOpen = false;
  let sidebarContainer = null;
  let sidebarIframe = null;
  let resizerHandle = null;
  let toggleBtn = null;
  let reflowStyleElement = null;

  // Track sidebar width (default 400px)
  let currentSidebarWidth = 400;
  let isDragging = false;

  function ensureReflowStylesheet() {
    if (document.getElementById(STYLE_ID)) {
      reflowStyleElement = document.getElementById(STYLE_ID);
      return;
    }

    reflowStyleElement = document.createElement("style");
    reflowStyleElement.id = STYLE_ID;
    updateReflowStyles(false);
    (document.head || document.documentElement).appendChild(reflowStyleElement);
  }

  function updateReflowStyles(noTransition = false) {
    if (!reflowStyleElement) return;

    const transitionStyle = noTransition ? "none !important" : "margin-right 0.25s ease, width 0.25s ease !important";

    reflowStyleElement.textContent = `
      html.sidebar-active {
        margin-right: ${currentSidebarWidth}px !important;
        width: calc(100% - ${currentSidebarWidth}px) !important;
        transition: ${transitionStyle};
      }
    `;
  }

  function initSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    ensureReflowStylesheet();

    // 1. Create sidebar container synchronously so sidebarContainer is never null
    sidebarContainer = document.createElement("div");
    sidebarContainer.id = SIDEBAR_ID;
    sidebarContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: ${currentSidebarWidth}px !important;
      height: 100vh !important;
      z-index: 2147483645 !important;
      transform: translateX(100%) !important;
      transition: transform 0.25s ease !important;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.15) !important;
      border-left: 1px solid rgba(0, 0, 0, 0.1) !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
    `;

    // 2. Draggable Resizer Bar on the left edge
    resizerHandle = document.createElement("div");
    resizerHandle.id = RESIZER_ID;
    resizerHandle.title = "Drag to resize sidebar width";
    resizerHandle.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: -4px !important;
      width: 8px !important;
      height: 100% !important;
      cursor: col-resize !important;
      z-index: 2147483646 !important;
      background: transparent !important;
      transition: background-color 0.2s ease !important;
    `;

    resizerHandle.addEventListener("mouseenter", () => {
      if (!isDragging) resizerHandle.style.background = "rgba(255, 107, 0, 0.4)";
    });

    resizerHandle.addEventListener("mouseleave", () => {
      if (!isDragging) resizerHandle.style.background = "transparent";
    });

    setupDragResizing(resizerHandle);
    sidebarContainer.appendChild(resizerHandle);

    // 3. Iframe for sidebar contents
    sidebarIframe = document.createElement("iframe");
    sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
    sidebarIframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      display: block !important;
    `;
    sidebarContainer.appendChild(sidebarIframe);
    (document.documentElement || document.body).appendChild(sidebarContainer);

    createToggleButton();

    // 4. Load saved width & theme & draft state from local storage asynchronously
    chrome.storage.local.get({ sidebarWidth: 400, sidebarOpen: false, primaryColor: "#ff6b00", isNoteDrafting: false }, (res) => {
      if (res.isNoteDrafting !== undefined) {
        isNoteDrafting = !!res.isNoteDrafting;
      }
      if (res.primaryColor) {
        currentThemeColor = res.primaryColor;
      }
      if (res.sidebarWidth && typeof res.sidebarWidth === "number") {
        currentSidebarWidth = Math.min(Math.max(180, res.sidebarWidth), Math.round(window.innerWidth * 0.85));
        if (sidebarContainer) {
          sidebarContainer.style.width = currentSidebarWidth + "px";
        }
      }

      updateReflowStyles();
      updateFloatingButtonsUI();

      if (res.sidebarOpen) {
        openSidebar(true);
      }
    });
  }

  function setupDragResizing(handle) {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      handle.style.background = "#ff6b00";

      // Temporarily disable pointer events on iframe so mouse moves smoothly across iframe boundaries
      if (sidebarIframe) {
        sidebarIframe.style.pointerEvents = "none";
      }
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      // Disable CSS transitions during active drag for 60fps tracking
      if (sidebarContainer) {
        sidebarContainer.style.transition = "none";
      }
      if (toggleContainer) {
        toggleContainer.style.transition = "none";
      }
      updateReflowStyles(true);

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;

        const minWidth = 180;
        const maxWidth = Math.round(window.innerWidth * 0.85);
        let newWidth = window.innerWidth - moveEvent.clientX;

        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;

        currentSidebarWidth = newWidth;

        sidebarContainer.style.width = currentSidebarWidth + "px";
        if (toggleContainer && isSidebarOpen) {
          toggleContainer.style.right = (currentSidebarWidth + 10) + "px";
        }

        updateReflowStyles(true);
        triggerResize();
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        handle.style.background = "transparent";
        if (sidebarIframe) {
          sidebarIframe.style.pointerEvents = "auto";
        }
        document.body.style.userSelect = "";
        document.body.style.cursor = "";

        // Restore transitions
        if (sidebarContainer) {
          sidebarContainer.style.transition = "transform 0.25s ease";
        }
        if (toggleContainer) {
          toggleContainer.style.transition = "right 0.25s ease";
        }
        updateReflowStyles(false);
        triggerResize();

        // Persist the user's chosen width
        chrome.storage.local.set({ sidebarWidth: currentSidebarWidth });

        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  let currentThemeColor = "#ff6b00";
  let currentActiveTab = "ai";
  let toggleContainer = null;
  let btnNoteToggle = null;
  let btnAiToggle = null;

  function getNoteSvg(color) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
  }

  function getAiSvg(color) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>`;
  }

  function getCollapseArrowSvg(color) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
  }

  function updateFloatingButtonsUI() {
    if (!btnNoteToggle || !btnAiToggle) return;

    if (!isSidebarOpen) {
      // Sidebar is closed: show both original icons
      btnNoteToggle.innerHTML = getNoteSvg(currentThemeColor);
      btnNoteToggle.title = "Notes";
      btnAiToggle.innerHTML = getAiSvg(currentThemeColor);
      btnAiToggle.title = "AI Assistant";
    } else {
      // Sidebar is open: the active tab shows the collapse arrow (>)
      if (currentActiveTab === "note") {
        btnNoteToggle.innerHTML = getCollapseArrowSvg(currentThemeColor);
        btnNoteToggle.title = "Collapse Sidebar";
        btnAiToggle.innerHTML = getAiSvg(currentThemeColor);
        btnAiToggle.title = "Switch to AI Assistant";
      } else {
        btnAiToggle.innerHTML = getCollapseArrowSvg(currentThemeColor);
        btnAiToggle.title = "Collapse Sidebar";
        btnNoteToggle.innerHTML = getNoteSvg(currentThemeColor);
        btnNoteToggle.title = "Switch to Notes";
      }
    }
  }

  function updateThemeColor(color) {
    if (!color) return;
    currentThemeColor = color;
    updateFloatingButtonsUI();
  }

  function createToggleButton() {
    if (document.getElementById(TOGGLE_BTN_ID)) return;

    toggleContainer = document.createElement("div");
    toggleContainer.id = TOGGLE_BTN_ID;
    toggleContainer.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      right: 10px !important;
      transform: translateY(-50%) !important;
      z-index: 2147483644 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      margin-left: 10px !important;
      transition: right 0.25s ease !important;
      user-select: none !important;
    `;

    // 1. Note Toggle Button
    btnNoteToggle = document.createElement("button");
    btnNoteToggle.id = "toggle-btn-note-floating";
    btnNoteToggle.title = "Notes";
    applyFloatingBtnStyles(btnNoteToggle);

    btnNoteToggle.addEventListener("click", () => {
      handleTabToggleClick("note");
    });

    // 2. AI Toggle Button
    btnAiToggle = document.createElement("button");
    btnAiToggle.id = "toggle-btn-ai-floating";
    btnAiToggle.title = "AI Assistant";
    applyFloatingBtnStyles(btnAiToggle);

    btnAiToggle.addEventListener("click", () => {
      handleTabToggleClick("ai");
    });

    toggleContainer.appendChild(btnNoteToggle);
    toggleContainer.appendChild(btnAiToggle);
    document.documentElement.appendChild(toggleContainer);

    updateFloatingButtonsUI();
  }

  function applyFloatingBtnStyles(btn) {
    btn.style.cssText = `
      background: #ffffff !important;
      border: 1px solid rgba(0, 0, 0, 0.12) !important;
      border-radius: 50% !important;
      width: 36px !important;
      height: 36px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      outline: none !important;
      user-select: none !important;
      padding: 0 !important;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.boxShadow = `0 4px 12px ${currentThemeColor}55`;
      btn.style.transform = "scale(1.12)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
      btn.style.transform = "scale(1)";
    });
  }

  async function handleTabToggleClick(targetTab) {
    if (!isSidebarOpen) {
      currentActiveTab = targetTab;
      chrome.storage.local.set({ activeTab: targetTab });
      openSidebar();
      if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage({ type: "SWITCH_TAB", tab: targetTab }, "*");
      }
      updateFloatingButtonsUI();
    } else {
      if (currentActiveTab === targetTab) {
        closeSidebar();
      } else {
        currentActiveTab = targetTab;
        chrome.storage.local.set({ activeTab: targetTab });
        if (sidebarIframe && sidebarIframe.contentWindow) {
          sidebarIframe.contentWindow.postMessage({ type: "SWITCH_TAB", tab: targetTab }, "*");
        }
        updateFloatingButtonsUI();
      }
    }
  }

  function triggerResize() {
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (e) { }
  }

  let lastToggleTime = 0;

  function openSidebar(skipStorageSet = false) {
    if (!sidebarContainer) initSidebar();
    if (isSidebarOpen) return;
    ensureReflowStylesheet();
    updateReflowStyles(false);
    isSidebarOpen = true;
    lastToggleTime = Date.now();

    if (sidebarContainer) {
      sidebarContainer.style.transform = "translateX(0%)";
    }
    document.documentElement.classList.add("sidebar-active");
    if (toggleContainer) {
      toggleContainer.style.right = (currentSidebarWidth + 10) + "px";
    }

    updateFloatingButtonsUI();
    triggerResize();
    setTimeout(triggerResize, 260);
    sendPageContextToIframe();
    if (!skipStorageSet) {
      chrome.storage.local.set({ sidebarOpen: true });
    }
  }

  function closeSidebar(skipStorageSet = false) {
    if (!sidebarContainer || !isSidebarOpen) return;
    isSidebarOpen = false;
    lastToggleTime = Date.now();

    if (sidebarContainer) {
      sidebarContainer.style.transform = "translateX(100%)";
    }
    document.documentElement.classList.remove("sidebar-active");
    if (toggleContainer) {
      toggleContainer.style.right = "10px";
    }

    updateFloatingButtonsUI();
    triggerResize();
    setTimeout(triggerResize, 260);
    if (!skipStorageSet) {
      chrome.storage.local.set({ sidebarOpen: false });
    }
  }

  function toggleSidebar() {
    if (Date.now() - lastToggleTime < 100) return;
    if (isSidebarOpen) closeSidebar();
    else openSidebar();
  }

  // Listen for toggle messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "TOGGLE_SIDEBAR") {
      toggleSidebar();
      sendResponse({ status: "ok", isOpen: isSidebarOpen });
    } else if (message.action === "OPEN_SIDEBAR") {
      openSidebar();
      sendResponse({ status: "ok", isOpen: isSidebarOpen });
    } else if (message.action === "CLOSE_SIDEBAR") {
      closeSidebar();
      sendResponse({ status: "ok", isOpen: isSidebarOpen });
    }
  });

  // ============================================================
  // WEBPAGE SELECTION COPY TO DRAFT POPUP (Active during Draft Mode)
  // ============================================================
  let isNoteDrafting = false;
  let copyBubblePopup = null;
  let copyBubbleBtn = null;
  let copyBubbleTimeout = null;

  function ensureCopyBubble() {
    if (copyBubblePopup && document.body.contains(copyBubblePopup)) return;

    copyBubblePopup = document.createElement("div");
    copyBubblePopup.id = "noteai-webpage-copy-popup";
    copyBubblePopup.style.cssText = `
      position: fixed !important;
      display: none;
      align-items: center !important;
      background: #0f172a !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      border-radius: 8px !important;
      padding: 3px 4px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      pointer-events: auto !important;
      transition: opacity 0.15s ease, transform 0.15s ease !important;
      user-select: none !important;
    `;

    copyBubbleBtn = document.createElement("button");
    copyBubbleBtn.type = "button";
    copyBubbleBtn.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      background: transparent !important;
      color: #ffffff !important;
      border: none !important;
      border-radius: 5px !important;
      padding: 6px 10px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      outline: none !important;
      transition: background-color 0.15s ease !important;
    `;

    copyBubbleBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="btn-text">Copy to Note</span>
    `;

    copyBubbleBtn.addEventListener("mouseenter", () => {
      copyBubbleBtn.style.backgroundColor = currentThemeColor || "#ff6b00";
    });

    copyBubbleBtn.addEventListener("mouseleave", () => {
      if (!copyBubbleBtn.dataset.copied) {
        copyBubbleBtn.style.backgroundColor = "transparent";
      }
    });

    copyBubbleBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    copyBubbleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      if (!selectedText) return;

      // 1. Send text to Sidebar Iframe Draft Editor
      if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage(
          { type: "APPEND_TO_DRAFT", text: selectedText },
          "*"
        );
      }

      // 2. Also copy to system clipboard
      try {
        navigator.clipboard.writeText(selectedText);
      } catch (err) { }

      // 3. Visual feedback
      copyBubbleBtn.dataset.copied = "true";
      copyBubbleBtn.style.backgroundColor = currentThemeColor || "#ff6b00";
      copyBubbleBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied to Note! ✓</span>
      `;

      setTimeout(() => {
        hideWebpageCopyBubble();
        copyBubbleBtn.dataset.copied = "";
        copyBubbleBtn.style.backgroundColor = "transparent";
        copyBubbleBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span class="btn-text">Copy to Note</span>
        `;
      }, 1200);
    });

    copyBubblePopup.appendChild(copyBubbleBtn);
    document.body.appendChild(copyBubblePopup);
  }

  function showWebpageCopyBubble(rect) {
    ensureCopyBubble();
    if (!copyBubblePopup) return;

    const popupWidth = 135;
    const popupHeight = 36;

    let left = rect.left + rect.width / 2 - popupWidth / 2;
    let top = rect.top - popupHeight - 8;

    // Boundary constraints
    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }

    if (top < 10) {
      top = rect.bottom + 8;
    }

    copyBubblePopup.style.left = `${left}px`;
    copyBubblePopup.style.top = `${top}px`;
    copyBubblePopup.style.display = "flex";
    copyBubblePopup.style.opacity = "1";
    copyBubblePopup.style.transform = "translateY(0) scale(1)";
  }

  function hideWebpageCopyBubble() {
    if (copyBubblePopup) {
      copyBubblePopup.style.display = "none";
    }
  }

  // Handle Webpage Text Selection
  function handleWebpageTextSelection() {
    if (!isNoteDrafting) {
      hideWebpageCopyBubble();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      hideWebpageCopyBubble();
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      hideWebpageCopyBubble();
      return;
    }

    // Ensure selection is outside our sidebar container
    const anchorNode = selection.anchorNode;
    if (anchorNode) {
      const el = anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement;
      if (el && el.closest && (el.closest(`#${SIDEBAR_ID}`) || el.closest(`#noteai-webpage-copy-popup`))) {
        return;
      }
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideWebpageCopyBubble();
      return;
    }

    showWebpageCopyBubble(rect);
  }

  document.addEventListener("mouseup", (e) => {
    // Don't hide if clicking on the popup itself
    if (copyBubblePopup && copyBubblePopup.contains(e.target)) return;
    setTimeout(handleWebpageTextSelection, 20);
  });

  document.addEventListener("selectionchange", () => {
    if (!isNoteDrafting) {
      hideWebpageCopyBubble();
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      hideWebpageCopyBubble();
    }
  });

  // ============================================================
  // TEXTAREA / INPUT / WHATSAPP WEB SELECTION AI ASSIST POPUP MODULE
  // ============================================================
  function escapeHtml(text) {
    if (!text) return "";
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  let inputAiPopup = null;
  let targetInputElement = null;
  let inputSelectionInfo = null; // { start, end, text, isEditable }
  let currentAiGeneratedText = "";

  function ensureInputAiPopup() {
    if (inputAiPopup && document.body.contains(inputAiPopup)) return;

    inputAiPopup = document.createElement("div");
    inputAiPopup.id = "noteai-input-ai-popup";
    inputAiPopup.style.cssText = `
      position: absolute !important;
      display: none;
      flex-direction: column !important;
      background: #ffffff !important;
      color: #1e293b !important;
      border: 1px solid rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 8px 10px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      pointer-events: auto !important;
      user-select: none !important;
      max-width: 340px !important;
      width: max-content !important;
      transition: opacity 0.15s ease, transform 0.15s ease !important;
    `;

    renderInputAiPopupPresets();
    document.body.appendChild(inputAiPopup);
  }

  function renderInputAiPopupPresets() {
    if (!inputAiPopup) return;

    const accentColor = currentThemeColor || "#ff6b00";

    inputAiPopup.innerHTML = `
      <div class="ai-popup-header" style="display:flex; align-items:center; justify-space-between; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; color:${accentColor}; text-transform:uppercase; letter-spacing:0.5px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
          </svg>
          NoteAI Assist
        </div>
        <button type="button" id="btn-close-input-ai-popup" style="background:transparent; border:none; color:#94a3b8; font-size:14px; cursor:pointer; padding:0 3px; line-height:1; outline:none;" title="Close">✕</button>
      </div>

      <div class="ai-popup-main-row" style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="ai-preset-btn" data-instruction="Fix all grammar, spelling, and punctuation errors cleanly." title="Fix Grammar">
          <span>✏️</span> Grammar
        </button>
        <button type="button" class="ai-preset-btn" data-instruction="Make the tone polite, professional, and respectful." title="Make Polite">
          <span>🤝</span> Polite
        </button>
        <button type="button" class="ai-preset-btn" data-instruction="Make text short, clear, and concise." title="Shorten">
          <span>⚡</span> Shorten
        </button>
        <button type="button" id="btn-toggle-custom-ai" class="ai-icon-toggle-btn" title="Custom AI Instruction">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
          </svg>
        </button>
      </div>

      <!-- Custom Prompt Section -->
      <div id="custom-ai-prompt-container" style="display:none; margin-top:8px; padding-top:6px; border-top:1px solid rgba(0,0,0,0.06);">
        <div style="display:flex; align-items:center; gap:6px;">
          <input type="text" id="custom-ai-prompt-input" placeholder="Prompt AI (e.g. Translate to Spanish...)" style="flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 9px; color:#0f172a; font-size:12px; outline:none; font-family:inherit;" />
          <button type="button" id="btn-submit-custom-ai" style="background:${accentColor}; color:#ffffff; border:none; border-radius:6px; padding:6px 11px; font-size:12px; font-weight:600; cursor:pointer; outline:none; flex-shrink:0;">
            ➤
          </button>
        </div>
      </div>

      <!-- Loading / Result Container -->
      <div id="ai-popup-status-container" style="display:none; margin-top:8px; padding-top:6px; border-top:1px solid rgba(0,0,0,0.06);">
      </div>
    `;

    applyInputAiPopupStyles();
    attachInputAiPopupEvents();
  }

  function applyInputAiPopupStyles() {
    if (!inputAiPopup) return;

    const accentColor = currentThemeColor || "#ff6b00";

    inputAiPopup.querySelectorAll(".ai-preset-btn").forEach((btn) => {
      btn.style.cssText = `
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        background: #f1f5f9 !important;
        color: #334155 !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 7px !important;
        padding: 5px 9px !important;
        font-size: 11.5px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        outline: none !important;
        transition: all 0.15s ease !important;
        white-space: nowrap !important;
      `;
      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#e2e8f0";
        btn.style.borderColor = accentColor;
        btn.style.color = "#0f172a";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#f1f5f9";
        btn.style.borderColor = "#e2e8f0";
        btn.style.color = "#334155";
      });
    });

    const toggleBtn = inputAiPopup.querySelector("#btn-toggle-custom-ai");
    if (toggleBtn) {
      toggleBtn.style.cssText = `
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(255, 107, 0, 0.2) !important;
        color: ${accentColor} !important;
        border: 1px solid ${accentColor} !important;
        border-radius: 7px !important;
        width: 28px !important;
        height: 28px !important;
        cursor: pointer !important;
        outline: none !important;
        flex-shrink: 0 !important;
        transition: transform 0.15s ease, box-shadow 0.15s ease !important;
      `;
      toggleBtn.addEventListener("mouseenter", () => {
        toggleBtn.style.transform = "scale(1.12)";
        toggleBtn.style.boxShadow = `0 0 12px ${accentColor}66`;
      });
      toggleBtn.addEventListener("mouseleave", () => {
        toggleBtn.style.transform = "scale(1)";
        toggleBtn.style.boxShadow = "none";
      });
    }

    const closeBtn = inputAiPopup.querySelector("#btn-close-input-ai-popup");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideInputAiPopup();
      });
    }
  }

  function attachInputAiPopupEvents() {
    if (!inputAiPopup) return;

    // Preset click
    inputAiPopup.querySelectorAll(".ai-preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const instruction = btn.dataset.instruction;
        if (instruction) runAiTextTransformation(instruction);
      });
    });

    // Custom prompt toggle
    const toggleBtn = inputAiPopup.querySelector("#btn-toggle-custom-ai");
    const customContainer = inputAiPopup.querySelector("#custom-ai-prompt-container");
    const customInput = inputAiPopup.querySelector("#custom-ai-prompt-input");
    const customSubmit = inputAiPopup.querySelector("#btn-submit-custom-ai");

    if (toggleBtn && customContainer) {
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden = customContainer.style.display === "none";
        customContainer.style.display = isHidden ? "block" : "none";
        if (isHidden && customInput) customInput.focus();
      });
    }

    if (customSubmit && customInput) {
      const handleCustomSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prompt = customInput.value.trim();
        if (prompt) runAiTextTransformation(prompt);
      };

      customSubmit.addEventListener("click", handleCustomSubmit);
      customInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleCustomSubmit(e);
      });
    }
  }

  // Execute AI Text Transformation
  async function runAiTextTransformation(instruction) {
    if (!inputSelectionInfo || !inputSelectionInfo.text) return;

    const statusContainer = inputAiPopup.querySelector("#ai-popup-status-container");
    if (!statusContainer) return;

    const accentColor = currentThemeColor || "#ff6b00";

    statusContainer.style.display = "block";
    statusContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#64748b; padding:4px 0;">
        <span style="display:inline-block; width:13px; height:13px; border:2px solid ${accentColor}; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
        <span>AI is rewriting text...</span>
      </div>
    `;

    try {
      const selectedText = inputSelectionInfo.text;
      const resultText = await callLlmForTextFix(selectedText, instruction);
      currentAiGeneratedText = resultText;

      statusContainer.innerHTML = `
        <div style="margin-bottom:4px; font-size:11px; font-weight:700; color:${accentColor}; text-transform:uppercase; letter-spacing:0.4px;">Suggested Replacement:</div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:7px; padding:7px 9px; font-size:12px; max-height:100px; overflow-y:auto; word-break:break-word; color:#1e293b; font-family:inherit; line-height:1.4;">${escapeHtml(resultText)}</div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button type="button" id="btn-accept-ai-replace" style="flex:1; background:${accentColor}; color:#ffffff; border:none; border-radius:7px; padding:6px 11px; font-size:11.5px; font-weight:600; cursor:pointer; outline:none; box-shadow:0 2px 8px ${accentColor}44;">Accept & Replace ✓</button>
          <button type="button" id="btn-cancel-ai-replace" style="background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; border-radius:7px; padding:6px 10px; font-size:11.5px; font-weight:500; cursor:pointer; outline:none;">Cancel</button>
        </div>
      `;

      const btnAccept = statusContainer.querySelector("#btn-accept-ai-replace");
      const btnCancel = statusContainer.querySelector("#btn-cancel-ai-replace");

      if (btnAccept) {
        btnAccept.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyAiReplacement(currentAiGeneratedText);
        });
      }

      if (btnCancel) {
        btnCancel.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          hideInputAiPopup();
        });
      }
    } catch (err) {
      statusContainer.innerHTML = `
        <div style="color:#f43f5e; font-size:11.5px; padding:4px 0; font-weight:500;">
          ⚠️ ${escapeHtml(err.message || "Failed to generate AI response.")}
        </div>
      `;
    }
  }

  // LLM API Call Helper for Input AI (Calls background script to bypass page CSP rules)
  async function callLlmForTextFix(selectedText, instruction) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { action: "CALL_LLM", selectedText, instruction },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message || "Extension message failed."));
              return;
            }
            if (response && response.success) {
              resolve(response.text);
            } else {
              reject(new Error(response?.error || "Failed to generate AI response."));
            }
          }
        );
      } else {
        reject(new Error("Extension context unavailable. Please reload page."));
      }
    });
  }

  // Apply replacement to target textarea / input / contenteditable (WhatsApp Web compatible)
  function applyAiReplacement(newText) {
    if (!targetInputElement || !inputSelectionInfo) return;

    const el = targetInputElement;
    const { start, end, isEditable } = inputSelectionInfo;

    if (isEditable) {
      try {
        el.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let replaced = false;
          try {
            replaced = document.execCommand("insertText", false, newText);
          } catch (e) { }

          if (!replaced) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(newText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } catch (err) { }
    } else {
      if (typeof start === "number" && typeof end === "number") {
        const val = el.value || "";
        const before = val.substring(0, start);
        const after = val.substring(end);
        el.value = before + newText + after;

        const newPos = before.length + newText.length;
        try {
          el.setSelectionRange(newPos, newPos);
        } catch (e) { }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    hideInputAiPopup();
  }

  function showInputAiPopup(rect) {
    ensureInputAiPopup();
    if (!inputAiPopup) return;

    renderInputAiPopupPresets();

    const popupWidth = 320;
    let left = rect.left + window.scrollX + rect.width / 2 - popupWidth / 2;
    let placeAbove = false;

    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }

    // Try placing below
    let top = rect.bottom + window.scrollY + 8;

    // If it goes off the bottom of the screen (assuming max height 200), place it above
    if (top + 200 > window.scrollY + window.innerHeight) {
      placeAbove = true;
      top = rect.top + window.scrollY - 8;
    }

    inputAiPopup.style.left = `${left}px`;
    inputAiPopup.style.top = `${top}px`;
    inputAiPopup.style.display = "flex";
    inputAiPopup.style.opacity = "1";
    
    if (placeAbove) {
      // translateY(-100%) keeps the bottom edge at 'top', so it grows upwards
      inputAiPopup.style.transform = "translateY(-100%) scale(1)";
    } else {
      inputAiPopup.style.transform = "translateY(0) scale(1)";
    }
  }

  function hideInputAiPopup() {
    if (inputAiPopup) {
      inputAiPopup.style.display = "none";
    }
  }

  // Check text selection across textareas, inputs, and contenteditable elements (WhatsApp Web)
  function checkInputTextSelection() {
    const sel = window.getSelection();
    let selectedText = "";
    let rect = null;
    let activeEl = document.activeElement;

    if (activeEl && activeEl.closest && (activeEl.closest(`#${SIDEBAR_ID}`) || activeEl.closest("#noteai-input-ai-popup"))) {
      return;
    }

    // 1. Check standard text inputs and textareas
    if (activeEl && (activeEl.tagName === "TEXTAREA" || (activeEl.tagName === "INPUT" && ["text", "search", "url", "email"].includes(activeEl.type)))) {
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (typeof start === "number" && typeof end === "number" && end - start > 0) {
        selectedText = (activeEl.value || "").substring(start, end).trim();
        targetInputElement = activeEl;
        inputSelectionInfo = { start, end, text: selectedText, isEditable: false };
        rect = activeEl.getBoundingClientRect();
      }
    } else if (sel && !sel.isCollapsed && sel.toString().trim()) {
      // 2. Check rich text editors & contenteditable regions (WhatsApp Web, Gmail, Notion, Slack)
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const el = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;

      if (el) {
        const editableEl = el.closest("[contenteditable='true'], [role='textbox'], [data-tab]");
        if (editableEl && !editableEl.closest(`#${SIDEBAR_ID}`) && !editableEl.closest("#noteai-input-ai-popup")) {
          selectedText = sel.toString().trim();
          targetInputElement = editableEl;
          inputSelectionInfo = { start: 0, end: 0, text: selectedText, isEditable: true };
          rect = range.getBoundingClientRect();
        }
      }
    }

    if (!selectedText || !rect || (rect.width === 0 && rect.height === 0)) {
      hideInputAiPopup();
      return;
    }

    showInputAiPopup(rect);
  }

  // Capture phase event listeners so page scripts (like WhatsApp Web) cannot swallow events
  document.addEventListener("mouseup", (e) => {
    if (inputAiPopup && inputAiPopup.contains(e.target)) return;
    setTimeout(checkInputTextSelection, 40);
  }, true);

  document.addEventListener("keyup", (e) => {
    if (inputAiPopup && inputAiPopup.contains(e.target)) return;
    if (["Shift", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      setTimeout(checkInputTextSelection, 40);
    }
  }, true);

  // Inject keyframe animation for spinner dot
  if (!document.getElementById("noteai-spinner-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "noteai-spinner-style";
    styleEl.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // Listen for storage changes in real-time across tabs
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.sidebarOpen !== undefined) {
          if (changes.sidebarOpen.newValue) {
            if (!isSidebarOpen) openSidebar();
          } else {
            if (isSidebarOpen) closeSidebar();
          }
        }
        if (changes.primaryColor && changes.primaryColor.newValue) {
          updateThemeColor(changes.primaryColor.newValue);
        }
        if (changes.activeTab && changes.activeTab.newValue) {
          currentActiveTab = changes.activeTab.newValue;
          updateFloatingButtonsUI();
        }
        if (changes.isNoteDrafting !== undefined) {
          isNoteDrafting = !!changes.isNoteDrafting.newValue;
          if (!isNoteDrafting) hideWebpageCopyBubble();
        }
      }
    });
  }

  function getFaviconUrl() {
    try {
      const faviconLink = document.querySelector("link[rel~='icon'], link[rel*='icon']");
      if (faviconLink && faviconLink.href && !faviconLink.href.startsWith("data:")) {
        return faviconLink.href;
      }
    } catch (e) { }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(window.location.hostname)}&sz=64`;
  }

  function getPageContextData() {
    const title = document.title || window.location.hostname || "Webpage";
    const url = window.location.href;
    const favicon = getFaviconUrl();

    let rawText = "";

    // 1. Check explicit semantic content tags first (only if substantial text >= 250 chars)
    const semanticMain = document.querySelector("main, article, [role='main']");
    if (semanticMain && semanticMain.innerText && semanticMain.innerText.trim().length >= 250) {
      rawText = semanticMain.innerText;
    }

    // 2. Fallback: Clone body, strip scripts/styles/nav/sidebar/footer, and extract clean text
    if (!rawText || rawText.trim().length < 250) {
      if (document.body) {
        const clone = document.body.cloneNode(true);
        // Remove non-content, navigation, footer, and sidebar elements
        clone.querySelectorAll("script, style, svg, noscript, iframe, nav, footer, #" + SIDEBAR_ID + ", [aria-hidden='true'], .sidebar, .widget, .ad, .comments").forEach((el) => el.remove());
        rawText = clone.innerText || "";
      }
    }

    const cleanText = rawText
      .replace(/\r\n|\r/g, "\n")
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim()
      .substring(0, 10000);

    return { title, url, favicon, bodyText: cleanText };
  }

  function sendPageContextToIframe() {
    if (sidebarIframe && sidebarIframe.contentWindow) {
      try {
        sidebarIframe.contentWindow.postMessage({
          type: "PAGE_CONTEXT_RESPONSE",
          pageContext: getPageContextData()
        }, "*");
      } catch (e) { }
    }
  }

  // Listen for window messages (from sidebar iframe)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "NOTE_DRAFT_STATE") {
      isNoteDrafting = !!event.data.isDrafting;
      if (!isNoteDrafting) hideWebpageCopyBubble();
    }
    if (event.data && event.data.type === "REQUEST_PAGE_CONTEXT") {
      sendPageContextToIframe();
    }
  });

  // Shortcut listener
  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      toggleSidebar();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar);
  } else {
    initSidebar();
  }
})();

