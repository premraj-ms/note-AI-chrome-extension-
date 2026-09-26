// AI View Component: Interactive Chat Assistant with LLM integration, session management & persistent history

import { StorageService } from "./storage.js";
import { showToast } from "./toast.js";
import { markdownToHtml } from "./markdown-util.js";

export function initAiView({ onOpenSettings } = {}) {
  const container = document.getElementById("ai-view-container");
  if (!container) return;

  container.innerHTML = `
    <section id="ai-view" class="view-panel ai-panel">
      <!-- AI Header -->
      <div class="ai-header">
        <div class="ai-header-title">
          <svg class="ai-sparkle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
          </svg>
          <span class="ai-title-text">AI Assistant</span>
          <span id="ai-provider-badge" class="ai-provider-badge">OPENAI</span>
        </div>
        <div class="ai-header-actions">
          <button type="button" id="btn-ai-toggle-history" class="ai-icon-btn" title="Past Conversations History">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
          <button type="button" id="btn-ai-new-chat" class="ai-icon-btn" title="Start New Chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button type="button" id="btn-ai-clear-history" class="ai-icon-btn danger" title="Clear All History">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- History Drawer Overlay -->
      <div id="ai-history-drawer" class="ai-history-drawer hidden">
        <div class="drawer-header">
          <div class="drawer-header-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Saved Conversations</span>
          </div>
          <button type="button" id="btn-close-history-drawer" class="ai-icon-btn" title="Close Drawer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="drawer-body">
          <button type="button" id="btn-drawer-start-new" class="drawer-new-chat-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Start New Chat</span>
          </button>
          <div id="history-sessions-list" class="history-sessions-list">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>

      <!-- Messages Scroll Body -->
      <div class="ai-chat-body" id="ai-chat-messages">
        <!-- Rendered dynamically -->
      </div>

      <!-- Bottom Chat Section -->
      <div class="ai-chat-footer">
        <!-- Webpage Context Attachment Bar -->
        <div class="ai-page-context-bar" id="ai-page-context-bar">
          <div class="page-context-chip" id="page-context-chip" title="Webpage context attached to AI prompts">
            <img id="ctx-favicon" class="ctx-favicon" src="" alt="icon" style="display:none;" />
            <svg id="ctx-fallback-icon" class="ctx-fallback-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span id="ctx-title" class="ctx-title">Current Webpage</span>
            <button type="button" id="btn-remove-context" class="btn-remove-context" title="Remove page context from AI messages">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <button type="button" id="btn-add-context" class="btn-add-context hidden" title="Attach webpage context to AI messages">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span>+ Attach Webpage</span>
          </button>
        </div>

        <!-- Quick Action Prompt Pills -->
        <div class="ai-quick-prompts" id="ai-quick-prompts">
          <button type="button" class="quick-prompt-btn" data-prompt="Summarize the key points of this webpage concisely.">
            <span class="qp-icon">📄</span> Summarize Page
          </button>
          <button type="button" class="quick-prompt-btn" data-prompt="Extract the main takeaways and bullet points from this content.">
            <span class="qp-icon">💡</span> Key Takeaways
          </button>
          <button type="button" class="quick-prompt-btn" data-prompt="Help me write a clear, structured note on this topic.">
            <span class="qp-icon">✍️</span> Draft Note
          </button>
        </div>

        <!-- Chat Input Form -->
        <div class="ai-input-bar">
          <textarea id="ai-chat-input" placeholder="Ask AI anything..." rows="1"></textarea>
          <button type="button" id="btn-ai-send" class="ai-send-btn" title="Send message">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `;

  const panel = document.getElementById("ai-view");
  const chatMessages = document.getElementById("ai-chat-messages");
  const chatInput = document.getElementById("ai-chat-input");
  const btnSend = document.getElementById("btn-ai-send");
  const providerBadge = document.getElementById("ai-provider-badge");
  const btnNewChat = document.getElementById("btn-ai-new-chat");
  const btnToggleHistory = document.getElementById("btn-ai-toggle-history");
  const btnClearHistory = document.getElementById("btn-ai-clear-history");
  const quickPrompts = document.getElementById("ai-quick-prompts");

  const historyDrawer = document.getElementById("ai-history-drawer");
  const btnCloseHistoryDrawer = document.getElementById("btn-close-history-drawer");
  const btnDrawerStartNew = document.getElementById("btn-drawer-start-new");
  const historySessionsList = document.getElementById("history-sessions-list");

  const pageContextChip = document.getElementById("page-context-chip");
  const ctxFavicon = document.getElementById("ctx-favicon");
  const ctxFallbackIcon = document.getElementById("ctx-fallback-icon");
  const ctxTitle = document.getElementById("ctx-title");
  const btnRemoveContext = document.getElementById("btn-remove-context");
  const btnAddContext = document.getElementById("btn-add-context");

  let chatSessions = [];
  let activeSessionId = "session_" + Date.now();
  let chatHistory = [];
  let isGenerating = false;
  let isPageContextAttached = true;
  let currentPageContext = {
    title: "Current Webpage",
    url: "",
    favicon: "",
    bodyText: ""
  };

  // Webpage Context Request & Listeners
  function requestPageContext() {
    try {
      window.parent.postMessage({ type: "REQUEST_PAGE_CONTEXT" }, "*");
    } catch (e) { }
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "PAGE_CONTEXT_RESPONSE" && event.data.pageContext) {
      currentPageContext = event.data.pageContext;
      updatePageContextUI();
    }
  });

  function updatePageContextUI() {
    if (currentPageContext.title) {
      ctxTitle.textContent = currentPageContext.title;
      ctxTitle.title = `${currentPageContext.title} (${currentPageContext.url || ""})`;
    }
    if (currentPageContext.favicon) {
      ctxFavicon.src = currentPageContext.favicon;
      ctxFavicon.style.display = "inline-block";
      if (ctxFallbackIcon) ctxFallbackIcon.style.display = "none";
      ctxFavicon.onerror = () => {
        ctxFavicon.style.display = "none";
        if (ctxFallbackIcon) ctxFallbackIcon.style.display = "inline-block";
      };
    } else {
      ctxFavicon.style.display = "none";
      if (ctxFallbackIcon) ctxFallbackIcon.style.display = "inline-block";
    }
  }

  btnRemoveContext.addEventListener("click", (e) => {
    e.stopPropagation();
    isPageContextAttached = false;
    pageContextChip.classList.add("hidden");
    btnAddContext.classList.remove("hidden");
    showToast("Webpage context removed");
  });

  btnAddContext.addEventListener("click", () => {
    isPageContextAttached = true;
    pageContextChip.classList.remove("hidden");
    btnAddContext.classList.add("hidden");
    requestPageContext();
    showToast("Webpage context attached 📄");
  });

  // 1. Auto-resize textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  });

  // 2. Load settings & active provider info
  async function updateProviderInfo() {
    const data = await StorageService.get();
    const provider = data.activeProvider || "openai";
    const settings = data.llmSettings || {};
    let modelName = "";

    if (provider === "openai") {
      modelName = settings.openai?.model || "gpt-4o";
    } else if (provider === "claude") {
      modelName = settings.claude?.model || "claude-3-5-sonnet";
    } else if (provider === "groq") {
      modelName = settings.groq?.model || "llama-3.3-70b";
    }

    if (providerBadge) {
      providerBadge.textContent = `${provider.toUpperCase()} (${modelName})`;
    }
  }

  // 3. Load Chat History & Sessions from Storage
  async function loadChatHistory() {
    const data = await StorageService.get({ chatSessions: [], activeSessionId: null, chatHistory: [] });
    chatSessions = Array.isArray(data.chatSessions) ? data.chatSessions : [];
    
    if (data.activeSessionId) {
      activeSessionId = data.activeSessionId;
    } else {
      activeSessionId = "session_" + Date.now();
    }

    chatHistory = Array.isArray(data.chatHistory) ? data.chatHistory : [];
    renderChatMessages();
    renderHistorySessionsList();
    await updateProviderInfo();
    requestPageContext();
  }

  // 4. Save Current Active Session into Sessions List
  async function saveCurrentSessionToHistory() {
    if (chatHistory.length === 0) return;

    const firstUserMsg = chatHistory.find((m) => m.role === "user");
    let sessionTitle = "Conversation";
    if (firstUserMsg && firstUserMsg.content) {
      sessionTitle = firstUserMsg.content.substring(0, 38).trim();
      if (firstUserMsg.content.length > 38) sessionTitle += "...";
    }

    const existingIdx = chatSessions.findIndex((s) => s.id === activeSessionId);
    const sessionObj = {
      id: activeSessionId,
      title: sessionTitle,
      updatedAt: new Date().toISOString(),
      displayDate: new Date().toLocaleTimeString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      messages: [...chatHistory]
    };

    if (existingIdx !== -1) {
      chatSessions[existingIdx] = sessionObj;
    } else {
      chatSessions.unshift(sessionObj);
    }

    await StorageService.set({ chatSessions, activeSessionId, chatHistory });
  }

  // 5. Start New Chat Session
  async function startNewChat(showNotification = true) {
    if (chatHistory.length > 0) {
      await saveCurrentSessionToHistory();
    }

    activeSessionId = "session_" + Date.now();
    chatHistory = [];
    await StorageService.set({ activeSessionId, chatHistory });

    renderChatMessages();
    renderHistorySessionsList();
    closeHistoryDrawer();

    if (showNotification) {
      showToast("Started a new chat session ✨");
    }
  }

  // 6. Load a Past Session from History
  async function loadPastSession(session) {
    if (!session) return;
    if (chatHistory.length > 0) {
      await saveCurrentSessionToHistory();
    }

    activeSessionId = session.id;
    chatHistory = Array.isArray(session.messages) ? session.messages : [];
    await StorageService.set({ activeSessionId, chatHistory });

    renderChatMessages();
    renderHistorySessionsList();
    closeHistoryDrawer();
    showToast(`Loaded "${session.title}" 📜`);
  }

  // 7. Delete a Specific Session from History
  async function deleteSession(sessionId, event) {
    if (event) event.stopPropagation();

    if (confirm("Delete this saved chat conversation?")) {
      chatSessions = chatSessions.filter((s) => s.id !== sessionId);

      if (activeSessionId === sessionId) {
        activeSessionId = "session_" + Date.now();
        chatHistory = [];
      }

      await StorageService.set({ chatSessions, activeSessionId, chatHistory });
      renderChatMessages();
      renderHistorySessionsList();
      showToast("Conversation deleted 🗑️");
    }
  }

  // 8. Render History Drawer Sessions List
  function renderHistorySessionsList() {
    if (!historySessionsList) return;
    historySessionsList.innerHTML = "";

    if (chatSessions.length === 0) {
      historySessionsList.innerHTML = `
        <div class="empty-history-state">
          <p>No saved past conversations yet.</p>
        </div>
      `;
      return;
    }

    chatSessions.forEach((session) => {
      const item = document.createElement("div");
      item.className = `history-session-item ${session.id === activeSessionId ? "active" : ""}`;
      
      const msgCount = Array.isArray(session.messages) ? session.messages.length : 0;

      item.innerHTML = `
        <div class="session-item-content">
          <div class="session-item-title">${escapeHtml(session.title || "Chat Session")}</div>
          <div class="session-item-meta">${msgCount} msg${msgCount === 1 ? "" : "s"} • ${session.displayDate || "Past Chat"}</div>
        </div>
        <button type="button" class="btn-delete-session" title="Delete conversation">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      item.addEventListener("click", () => loadPastSession(session));
      
      const btnDel = item.querySelector(".btn-delete-session");
      btnDel.addEventListener("click", (e) => deleteSession(session.id, e));

      historySessionsList.appendChild(item);
    });
  }

  // 9. Drawer Controls
  function openHistoryDrawer() {
    renderHistorySessionsList();
    historyDrawer.classList.remove("hidden");
  }

  function closeHistoryDrawer() {
    historyDrawer.classList.add("hidden");
  }

  btnToggleHistory.addEventListener("click", () => {
    if (historyDrawer.classList.contains("hidden")) {
      openHistoryDrawer();
    } else {
      closeHistoryDrawer();
    }
  });

  btnCloseHistoryDrawer.addEventListener("click", closeHistoryDrawer);
  btnDrawerStartNew.addEventListener("click", () => startNewChat(true));

  // 10. Render Active Chat Messages
  function renderChatMessages() {
    chatMessages.innerHTML = "";

    if (chatHistory.length === 0) {
      chatMessages.innerHTML = `
        <div class="ai-empty-state">
          <div class="ai-empty-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
            </svg>
          </div>
          <h4>How can I help you today?</h4>
          <p>Ask any question, analyze webpage content, or generate notes with your AI assistant.</p>
        </div>
      `;
      return;
    }

    chatHistory.forEach((msg) => {
      const msgEl = document.createElement("div");
      msgEl.className = `chat-msg ${msg.role === "user" ? "user-msg" : "ai-msg"}`;
      msgEl.dataset.id = msg.id;

      if (msg.role === "user") {
        msgEl.innerHTML = `
          <div class="msg-bubble user-bubble">
            <div class="msg-text">${escapeHtml(msg.content)}</div>
            <div class="msg-meta">${msg.timestamp || ""}</div>
          </div>
        `;
      } else {
        const formattedContent = markdownToHtml(msg.content || "");
        msgEl.innerHTML = `
          <div class="msg-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
            </svg>
          </div>
          <div class="msg-bubble ai-bubble">
            <div class="msg-text markdown-body">${formattedContent}</div>
            <div class="msg-actions">
              <span class="msg-meta">${msg.timestamp || ""}</span>
              <div class="msg-btn-group">
                <button type="button" class="btn-msg-action btn-copy-msg" title="Copy response text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Copy</span>
                </button>
                <button type="button" class="btn-msg-action btn-save-as-note" title="Save as a new note in NoteAI">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 1-2 2v16a2 2 0 0 1 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <span>Save to Note</span>
                </button>
              </div>
            </div>
          </div>
        `;

        // Action listeners
        const btnCopy = msgEl.querySelector(".btn-copy-msg");
        const btnSaveNote = msgEl.querySelector(".btn-save-as-note");

        if (btnCopy) {
          btnCopy.addEventListener("click", () => {
            navigator.clipboard.writeText(msg.content);
            showToast("Copied response to clipboard! ✓");
          });
        }

        if (btnSaveNote) {
          btnSaveNote.addEventListener("click", async () => {
            const data = await StorageService.get({ notes: [] });
            const existingNotes = Array.isArray(data.notes) ? data.notes : [];
            const newNote = {
              id: "note_" + Date.now(),
              title: `AI Summary (${msg.timestamp || "Today"})`,
              content: msg.content,
              checked: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            existingNotes.unshift(newNote);
            await StorageService.set({ notes: existingNotes });
            showToast("Saved AI response as a new Note! 📝");
          });
        }
      }

      chatMessages.appendChild(msgEl);
    });

    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 40);
  }

  // 11. Show Typing Indicator
  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "ai-typing-indicator";
    indicator.className = "chat-msg ai-msg typing-msg";
    indicator.innerHTML = `
      <div class="msg-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
        </svg>
      </div>
      <div class="msg-bubble ai-bubble typing-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(indicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById("ai-typing-indicator");
    if (indicator) indicator.remove();
  }

  async function getFreshPageContext() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data && event.data.type === "PAGE_CONTEXT_RESPONSE" && event.data.pageContext) {
          window.removeEventListener("message", handler);
          currentPageContext = event.data.pageContext;
          updatePageContextUI();
          resolve(event.data.pageContext);
        }
      };
      window.addEventListener("message", handler);
      try {
        window.parent.postMessage({ type: "REQUEST_PAGE_CONTEXT" }, "*");
      } catch (e) {
        resolve(currentPageContext);
      }
      setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(currentPageContext);
      }, 350);
    });
  }

  // 12. Handle Send Message
  async function sendMessage(userText = "") {
    const text = (userText || chatInput.value).trim();
    if (!text || isGenerating) return;

    // Check API Key
    const data = await StorageService.get();
    const provider = data.activeProvider || "openai";
    const settings = data.llmSettings || {};
    let apiKey = "";
    let model = "";

    if (provider === "openai") {
      apiKey = settings.openai?.apiKey || "";
      model = settings.openai?.model || "gpt-4o";
    } else if (provider === "claude") {
      apiKey = settings.claude?.apiKey || "";
      model = settings.claude?.model || "claude-3-5-sonnet-20241022";
    } else if (provider === "groq") {
      apiKey = settings.groq?.apiKey || "";
      model = settings.groq?.model || "llama-3.3-70b-versatile";
    }

    if (!apiKey) {
      showToast(`Please enter your ${provider.toUpperCase()} API key in Settings`);
      if (onOpenSettings) onOpenSettings();
      return;
    }

    // Add User Message
    const userMsg = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    chatHistory.push(userMsg);
    await saveCurrentSessionToHistory();
    renderChatMessages();

    chatInput.value = "";
    chatInput.style.height = "auto";
    isGenerating = true;

    showTypingIndicator();

    try {
      let aiResponseText = "";
      let promptToSend = text;

      if (isPageContextAttached) {
        const freshContext = await getFreshPageContext();
        if (freshContext && freshContext.bodyText) {
          promptToSend = `[WEBPAGE CONTEXT]:\nTitle: ${freshContext.title || "Current Webpage"}\nURL: ${freshContext.url || ""}\nExtracted Webpage Text:\n"""\n${freshContext.bodyText}\n"""\n\n[USER QUESTION / REQUEST]:\n${text}`;
        }
      }

      const systemPrompt = "You are a helpful AI reading assistant inside a browser sidebar. The user has provided webpage content in [WEBPAGE CONTEXT]. Use the extracted webpage text to answer the user's questions clearly, accurately, and format your response using clean Markdown.";

      if (provider === "openai" || provider === "groq") {
        const endpoint = provider === "openai" 
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.groq.com/openai/v1/chat/completions";

        const historySlice = chatHistory.slice(-10);
        const apiMessages = [
          { role: "system", content: systemPrompt }
        ];

        historySlice.forEach((m, idx) => {
          if (idx === historySlice.length - 1 && m.role === "user") {
            apiMessages.push({ role: "user", content: promptToSend });
          } else {
            apiMessages.push({ role: m.role, content: m.content });
          }
        });

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: apiMessages,
            temperature: 0.7
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API HTTP ${res.status}: ${res.statusText}`);
        }

        const resData = await res.json();
        aiResponseText = resData.choices?.[0]?.message?.content || "No response generated.";
      } else if (provider === "claude") {
        const historySlice = chatHistory.slice(-10);
        const apiMessages = historySlice.map((m, idx) => {
          const content = (idx === historySlice.length - 1 && m.role === "user") ? promptToSend : m.content;
          return {
            role: m.role === "user" ? "user" : "assistant",
            content: content
          };
        });

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: apiMessages
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Claude API HTTP ${res.status}`);
        }

        const resData = await res.json();
        aiResponseText = resData.content?.[0]?.text || "No response generated.";
      }

      hideTypingIndicator();

      const aiMsg = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        provider,
        model
      };

      chatHistory.push(aiMsg);
      await saveCurrentSessionToHistory();
      renderChatMessages();
    } catch (err) {
      hideTypingIndicator();
      const errorMsg = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: `⚠️ **Error generating response:**\n\n${err.message || err}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      chatHistory.push(errorMsg);
      await saveCurrentSessionToHistory();
      renderChatMessages();
    } finally {
      isGenerating = false;
    }
  }

  // 13. Input Event Listeners
  btnSend.addEventListener("click", () => sendMessage());

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Quick Prompts Click
  quickPrompts.addEventListener("click", (e) => {
    const btn = e.target.closest(".quick-prompt-btn");
    if (btn && btn.dataset.prompt) {
      sendMessage(btn.dataset.prompt);
    }
  });

  // Header Actions
  btnNewChat.addEventListener("click", () => startNewChat(true));

  btnClearHistory.addEventListener("click", async () => {
    if (chatSessions.length === 0 && chatHistory.length === 0) return;
    if (confirm("Are you sure you want to clear all chat history & saved conversations?")) {
      chatSessions = [];
      chatHistory = [];
      activeSessionId = "session_" + Date.now();
      await StorageService.set({ chatSessions: [], chatHistory: [], activeSessionId });
      renderChatMessages();
      renderHistorySessionsList();
      closeHistoryDrawer();
      showToast("All chat history cleared 🗑️");
    }
  });

  // Helper
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Real-time Storage Listener for Cross-Tab Sync
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.chatHistory) {
          chatHistory = Array.isArray(changes.chatHistory.newValue) ? changes.chatHistory.newValue : [];
          renderChatMessages();
        }
        if (changes.chatSessions) {
          chatSessions = Array.isArray(changes.chatSessions.newValue) ? changes.chatSessions.newValue : [];
          renderHistorySessionsList();
        }
        if (changes.activeProvider || changes.llmSettings) {
          updateProviderInfo();
        }
      }
    });
  }

  // Initial Load
  loadChatHistory();

  return {
    show: () => {
      panel.classList.add("active");
      requestPageContext();
      scrollToBottom();
    },
    hide: () => panel.classList.remove("active")
  };
}


