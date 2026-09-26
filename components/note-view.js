// Note View Component: Note List + Full-Sized Rich Text Note Writer Editor with Floating Selection Bubble Toolbar, Dropdown Headings, Hyperlinks, Todo Checkboxes & Markdown Storage

import { StorageService } from "./storage.js";
import { showToast } from "./toast.js";
import { markdownToHtml, htmlToMarkdown, stripMarkdown } from "./markdown-util.js";

export function initNoteView() {
  const container = document.getElementById("note-view-container");
  if (!container) return;

  container.innerHTML = `
    <section id="note-view" class="view-panel note-panel">
      <!-- 1. SUB-VIEW: Notes List View -->
      <div id="note-list-subview" class="note-subview active">
        <!-- Note Top Action Bar -->
        <div class="note-action-bar">
          <button id="btn-create-note" class="create-note-btn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Note</span>
          </button>

          <button id="btn-delete-notes" class="note-icon-btn delete-btn" title="Delete Selected Notes" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>

        <!-- Notes List Scroll Area -->
        <div class="notes-scroll-area">
          <div id="notes-list" class="notes-list"></div>

          <!-- Empty State -->
          <div id="note-empty-state" class="empty-notes-view hidden">
            <div class="empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h4>No Notes Yet</h4>
            <p>Click <strong>+ Create Note</strong> to write your first markdown note.</p>
          </div>
        </div>
      </div>

      <!-- 2. SUB-VIEW: Full-Sized Rich Text Note Writer Editor -->
      <div id="note-editor-subview" class="note-subview">
        <!-- Editor Header -->
        <div class="editor-header">
          <button id="btn-editor-back" class="editor-back-btn" title="Back to Notes" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          <div class="editor-title-container">
            <input type="text" id="editor-title-input" class="editor-title-input" placeholder="Note heading..." autocomplete="off">
          </div>

          <button id="btn-editor-save" class="editor-save-btn" title="Save Note (Markdown)" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save</span>
          </button>
        </div>

        <!-- Rich Text Editor Container -->
        <div class="editor-body-wrapper" id="editor-body-wrapper">
          <!-- Floating Selection Formatting Bubble Toolbar -->
          <div id="bubble-toolbar" class="bubble-toolbar hidden">
            <!-- Bold -->
            <button type="button" class="bubble-btn" data-cmd="bold" title="Bold (**bold**)">
              <strong>B</strong>
            </button>
            <!-- Italic -->
            <button type="button" class="bubble-btn" data-cmd="italic" title="Italic (*italic*)">
              <em>I</em>
            </button>

            <span class="bubble-separator"></span>

            <!-- Heading Style Dropdown -->
            <div class="bubble-dropdown-wrap" title="Text style">
              <select id="bubble-heading-select" class="bubble-select">
                <option value="p">P</option>
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
              </select>
              <svg class="bubble-select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            <span class="bubble-separator"></span>

            <!-- Todo / Task Checkbox List -->
            <button type="button" class="bubble-btn" data-cmd="todo" title="Checklist Todo (- [ ])">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </button>

            <!-- Unordered List -->
            <button type="button" class="bubble-btn" data-cmd="insertUnorderedList" title="Bullet List (- item)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <circle cx="4" cy="6" r="2" fill="currentColor"></circle>
                <circle cx="4" cy="12" r="2" fill="currentColor"></circle>
                <circle cx="4" cy="18" r="2" fill="currentColor"></circle>
              </svg>
            </button>

            <!-- Ordered List -->
            <button type="button" class="bubble-btn" data-cmd="insertOrderedList" title="Numbered List (1. item)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="10" y1="12" x2="21" y2="12"></line>
                <line x1="10" y1="18" x2="21" y2="18"></line>
                <path d="M4 6h1v4"></path>
                <path d="M4 10h2"></path>
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
              </svg>
            </button>

            <!-- Blockquote -->
            <button type="button" class="bubble-btn" data-cmd="blockquote" title="Quote (> quote)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
              </svg>
            </button>

            <span class="bubble-separator"></span>

            <!-- Hyperlink Insert -->
            <button type="button" class="bubble-btn" id="btn-bubble-link" title="Insert Link ([text](url))">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>

            <!-- Image Link & Insert -->
            <button type="button" class="bubble-btn" id="btn-bubble-image" title="Insert Image Link or File">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>

          <!-- Hidden Image File Input for File Picker Insertion -->
          <input type="file" id="editor-image-file-input" accept="image/*" class="hidden">

          <!-- Hyperlink Prompt Popover (Sub-toolbar) -->
          <div id="link-insert-popover" class="image-insert-popover hidden">
            <input type="text" id="link-url-input" placeholder="Paste link URL (https://...)" autocomplete="off">
            <button type="button" id="btn-confirm-link-url" class="btn-popover-ok">Insert</button>
            <button type="button" id="btn-cancel-link-popover" class="btn-popover-cancel">✕</button>
          </div>

          <!-- Image URL Prompt Popover (Sub-toolbar) -->
          <div id="image-insert-popover" class="image-insert-popover hidden">
            <input type="text" id="image-url-input" placeholder="Paste image URL (https://...)" autocomplete="off">
            <button type="button" id="btn-confirm-image-url" class="btn-popover-ok">Insert</button>
            <button type="button" id="btn-browse-image-file" class="btn-popover-browse" title="Choose local image file">Upload</button>
            <button type="button" id="btn-cancel-image-popover" class="btn-popover-cancel">✕</button>
          </div>

          <!-- The Rich Text Contenteditable Document -->
          <div
            id="note-rich-editor"
            class="note-rich-editor"
            contenteditable="true"
            data-placeholder="Start typing your note here... Select any text to format, add links, todo checklists, or drag and drop images."
            spellcheck="true"
          ></div>
        </div>

        <!-- Editor Status Footer -->
        <div class="editor-footer">
          <div class="editor-stats">
            <span id="editor-word-count">0 words</span>
            <span class="stats-bullet">•</span>
            <span id="editor-char-count">0 chars</span>
          </div>
          <div class="editor-footer-right">
            <span class="markdown-badge" title="Automatically formatted and stored as Markdown">Markdown</span>
            <span id="editor-save-indicator" class="save-indicator">Saved</span>
          </div>
        </div>
      </div>
    </section>
  `;

  // Element References
  const panel = document.getElementById("note-view");
  const listSubview = document.getElementById("note-list-subview");
  const editorSubview = document.getElementById("note-editor-subview");

  // List View Elements
  const btnCreateNote = document.getElementById("btn-create-note");
  const btnDeleteNotes = document.getElementById("btn-delete-notes");
  const notesList = document.getElementById("notes-list");
  const noteEmptyState = document.getElementById("note-empty-state");

  // Editor Elements
  const btnEditorBack = document.getElementById("btn-editor-back");
  const btnEditorSave = document.getElementById("btn-editor-save");
  const editorTitleInput = document.getElementById("editor-title-input");
  const noteRichEditor = document.getElementById("note-rich-editor");
  const editorBodyWrapper = document.getElementById("editor-body-wrapper");
  const bubbleToolbar = document.getElementById("bubble-toolbar");
  const bubbleHeadingSelect = document.getElementById("bubble-heading-select");
  const editorWordCount = document.getElementById("editor-word-count");
  const editorCharCount = document.getElementById("editor-char-count");
  const editorSaveIndicator = document.getElementById("editor-save-indicator");

  // Link popover elements
  const btnBubbleLink = document.getElementById("btn-bubble-link");
  const linkInsertPopover = document.getElementById("link-insert-popover");
  const linkUrlInput = document.getElementById("link-url-input");
  const btnConfirmLinkUrl = document.getElementById("btn-confirm-link-url");
  const btnCancelLinkPopover = document.getElementById("btn-cancel-link-popover");

  // Image popover elements
  const btnBubbleImage = document.getElementById("btn-bubble-image");
  const imageInsertPopover = document.getElementById("image-insert-popover");
  const imageUrlInput = document.getElementById("image-url-input");
  const btnConfirmImageUrl = document.getElementById("btn-confirm-image-url");
  const btnBrowseImageFile = document.getElementById("btn-browse-image-file");
  const btnCancelImagePopover = document.getElementById("btn-cancel-image-popover");
  const editorImageFileInput = document.getElementById("editor-image-file-input");

  // State
  let notes = [];
  let currentEditingNote = null;
  let savedSelectionRange = null;

  // 1. Load Notes from Storage
  async function loadNotes() {
    const data = await StorageService.get({ notes: [] });
    notes = Array.isArray(data.notes) ? data.notes : [];
    renderNotesList();
  }

  // 2. Render Note List
  function renderNotesList() {
    notesList.innerHTML = "";

    if (notes.length === 0) {
      noteEmptyState.classList.remove("hidden");
      updateDeleteButtonState();
      return;
    }

    noteEmptyState.classList.add("hidden");

    notes.forEach((note) => {
      const item = document.createElement("div");
      item.className = `note-item ${note.checked ? "checked" : ""}`;
      item.dataset.id = note.id;

      const previewSnippet = stripMarkdown(note.content || "");

      item.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" class="note-checkbox" ${note.checked ? "checked" : ""}>
          <span class="custom-checkmark"></span>
        </label>
        <div class="note-info" title="Click to edit note">
          <div class="note-heading-text">${escapeHtml(note.title || "Untitled")}</div>
          ${previewSnippet ? `<div class="note-preview-text">${escapeHtml(previewSnippet)}</div>` : `<div class="note-preview-text empty-preview">Empty note</div>`}
        </div>
        <button type="button" class="btn-note-edit" title="Edit Note in Writer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      `;

      // Checkbox click
      const checkbox = item.querySelector(".note-checkbox");
      checkbox.addEventListener("change", (e) => {
        note.checked = e.target.checked;
        item.classList.toggle("checked", note.checked);
        saveNotesToStorage();
        updateDeleteButtonState();
      });

      // Note Row Click & Edit Button Click -> Open Rich Text Writer
      const noteInfo = item.querySelector(".note-info");
      const btnEdit = item.querySelector(".btn-note-edit");

      noteInfo.addEventListener("click", () => openNoteWriter(note));
      btnEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        openNoteWriter(note);
      });

      notesList.appendChild(item);
    });

    updateDeleteButtonState();
  }

  function updateDeleteButtonState() {
    const checkedCount = notes.filter((n) => n.checked).length;
    if (checkedCount > 0) {
      btnDeleteNotes.classList.add("has-selected");
      btnDeleteNotes.title = `Delete ${checkedCount} selected note${checkedCount === 1 ? "" : "s"}`;
    } else {
      btnDeleteNotes.classList.remove("has-selected");
      btnDeleteNotes.title = "Select notes with checkboxes to delete";
    }
  }

  async function saveNotesToStorage() {
    await StorageService.set({ notes });
  }

  // 3. Delete Selected Notes
  async function handleDeleteSelectedNotes() {
    const selectedNotes = notes.filter((n) => n.checked);
    if (selectedNotes.length === 0) {
      showToast("Check the boxes next to notes you want to delete");
      return;
    }

    const count = selectedNotes.length;
    if (confirm(`Are you sure you want to delete ${count} selected note${count === 1 ? "" : "s"}?`)) {
      notes = notes.filter((n) => !n.checked);
      await saveNotesToStorage();
      renderNotesList();
      showToast(`${count} note${count === 1 ? "" : "s"} deleted`);
    }
  }

  // 4. Open Note Writer Sub-view (Full-sized Editor)
  function openNoteWriter(note = null) {
    currentEditingNote = note;

    listSubview.classList.remove("active");
    editorSubview.classList.add("active");

    hideBubbleToolbar();
    hideImagePopover();
    hideLinkPopover();

    // Broadcast draft mode is active
    StorageService.set({ isNoteDrafting: true });
    try {
      window.parent.postMessage({ type: "NOTE_DRAFT_STATE", isDrafting: true }, "*");
    } catch (e) { }

    if (note) {
      editorTitleInput.value = note.title || "";
      // Convert stored Markdown to Rich Text HTML
      noteRichEditor.innerHTML = markdownToHtml(note.content || "");
    } else {
      // New note
      editorTitleInput.value = "";
      noteRichEditor.innerHTML = "";
    }

    updateEditorStats();
    editorSaveIndicator.textContent = "Saved";

    // Focus editor
    setTimeout(() => {
      if (!editorTitleInput.value) {
        editorTitleInput.focus();
      } else {
        noteRichEditor.focus();
      }
    }, 50);
  }

  // 5. Close Note Writer & Return to List
  function closeNoteWriter(saveBeforeExit = true) {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    if (saveBeforeExit) {
      saveCurrentEditorNote(false);
    }
    currentEditingNote = null;
    hideBubbleToolbar();
    hideImagePopover();
    hideLinkPopover();

    // Broadcast draft mode is closed
    StorageService.set({ isNoteDrafting: false });
    try {
      window.parent.postMessage({ type: "NOTE_DRAFT_STATE", isDrafting: false }, "*");
    } catch (e) { }

    editorSubview.classList.remove("active");
    listSubview.classList.add("active");
    renderNotesList();
  }

  // 6. Save Note from Editor
  async function saveCurrentEditorNote(showSuccessToast = false) {
    const title = editorTitleInput.value.trim();
    // Convert current Rich Text HTML to Markdown format
    const markdownContent = htmlToMarkdown(noteRichEditor);
    const plainText = noteRichEditor.innerText.trim();

    if (!title && !markdownContent && !plainText) {
      if (showSuccessToast) showToast("Note is empty");
      return;
    }

    const finalTitle = title || "Untitled";

    if (currentEditingNote) {
      // Update existing note
      notes = notes.map((n) => {
        if (n.id === currentEditingNote.id) {
          return {
            ...n,
            title: finalTitle,
            content: markdownContent,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });
      currentEditingNote.title = finalTitle;
      currentEditingNote.content = markdownContent;
    } else {
      // Create new note
      const newNote = {
        id: "note_" + Date.now(),
        title: finalTitle,
        content: markdownContent,
        checked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      notes.unshift(newNote);
      currentEditingNote = newNote;
    }

    await saveNotesToStorage();
    editorSaveIndicator.textContent = "Saved";

    if (showSuccessToast) {
      showToast("Note saved (Markdown)");
    }
  }

  // Debounced Auto-Saver
  let autoSaveTimeout = null;
  function triggerAutoSave() {
    editorSaveIndicator.textContent = "Saving...";
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(async () => {
      await saveCurrentEditorNote(false);
    }, 600);
  }

  // 7. Update Stats (Word count & Char count)
  function updateEditorStats() {
    const text = noteRichEditor.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    editorWordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;
    editorCharCount.textContent = `${chars} char${chars === 1 ? "" : "s"}`;
  }

  // 8. Floating Selection Bubble Toolbar Logic
  function updateBubbleToolbarPosition() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      hideBubbleToolbar();
      return;
    }

    // Ensure selection is inside noteRichEditor
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !noteRichEditor.contains(anchorNode)) {
      hideBubbleToolbar();
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      hideBubbleToolbar();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const wrapperRect = editorBodyWrapper.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      hideBubbleToolbar();
      return;
    }

    savedSelectionRange = range.cloneRange();

    // Position bubble above the selection
    bubbleToolbar.classList.remove("hidden");
    const toolbarWidth = bubbleToolbar.offsetWidth || 340;
    const toolbarHeight = bubbleToolbar.offsetHeight || 38;

    let left = rect.left + rect.width / 2 - toolbarWidth / 2 - wrapperRect.left;
    let top = rect.top - wrapperRect.top - toolbarHeight - 10;

    // Boundary constraints inside editor wrapper
    if (left < 10) left = 10;
    if (left + toolbarWidth > wrapperRect.width - 10) {
      left = wrapperRect.width - toolbarWidth - 10;
    }

    // If too close to top, show below selection
    if (top < 10) {
      top = rect.bottom - wrapperRect.top + 10;
    }

    bubbleToolbar.style.left = `${left}px`;
    bubbleToolbar.style.top = `${top}px`;

    // Highlight active state for bold/italic and heading select
    updateBubbleActiveStates();
  }

  function hideBubbleToolbar() {
    bubbleToolbar.classList.add("hidden");
  }

  function updateBubbleActiveStates() {
    // 1. Buttons active states
    bubbleToolbar.querySelectorAll(".bubble-btn[data-cmd]").forEach((btn) => {
      const cmd = btn.dataset.cmd;
      if (cmd === "bold" || cmd === "italic" || cmd === "insertUnorderedList" || cmd === "insertOrderedList") {
        try {
          if (document.queryCommandState(cmd)) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        } catch (e) {
          btn.classList.remove("active");
        }
      }
    });

    // 2. Heading Select Dropdown state
    if (bubbleHeadingSelect) {
      const parentBlock = getParentBlockTag();
      if (parentBlock && ["H1", "H2", "H3", "P"].includes(parentBlock)) {
        bubbleHeadingSelect.value = parentBlock.toLowerCase();
      } else {
        bubbleHeadingSelect.value = "p";
      }
    }
  }

  function restoreSavedSelection() {
    if (savedSelectionRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRange);
    }
  }

  // 9. Format Commands Execution
  function executeFormat(cmd) {
    noteRichEditor.focus();
    restoreSavedSelection();

    if (cmd === "todo") {
      // Convert selection or current line to Todo Checklist Item
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "Todo item";
      const todoHtml = `<ul class="task-list"><li class="task-list-item"><input type="checkbox" class="task-checkbox" contenteditable="false"><span class="task-text">${escapeHtml(selectedText || "Todo item")}</span></li></ul>`;
      document.execCommand("insertHTML", false, todoHtml);
    } else if (cmd === "blockquote") {
      const parentBlock = getParentBlockTag();
      if (parentBlock === "BLOCKQUOTE") {
        document.execCommand("formatBlock", false, "<p>");
      } else {
        document.execCommand("formatBlock", false, "<blockquote>");
      }
    } else {
      document.execCommand(cmd, false, null);
    }

    updateEditorStats();
    triggerAutoSave();
    setTimeout(updateBubbleToolbarPosition, 10);
  }

  function getParentBlockTag() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    let node = selection.anchorNode;
    while (node && node !== noteRichEditor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toUpperCase();
        if (["H1", "H2", "H3", "BLOCKQUOTE", "P", "UL", "OL", "LI"].includes(tag)) {
          return tag;
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  // 10. Link Insertion Logic
  function insertLinkElement(url) {
    if (!url) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("mailto:") && !finalUrl.startsWith("#")) {
      finalUrl = "https://" + finalUrl;
    }

    noteRichEditor.focus();
    restoreSavedSelection();

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText) {
      const linkHtml = `<a href="${escapeHtml(finalUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(selectedText)}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    } else {
      const linkHtml = `<a href="${escapeHtml(finalUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(finalUrl)}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    }

    updateEditorStats();
    triggerAutoSave();
  }

  function showLinkPopover() {
    hideImagePopover();
    savedSelectionRange = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).cloneRange() : null;
    linkInsertPopover.classList.remove("hidden");
    linkUrlInput.value = "";
    linkUrlInput.focus();
  }

  function hideLinkPopover() {
    linkInsertPopover.classList.add("hidden");
    linkUrlInput.value = "";
  }

  // 11. Image Insertion & Drag and Drop Handling
  function insertImageElement(src, alt = "Image") {
    if (!src) return;
    noteRichEditor.focus();
    restoreSavedSelection();

    const imgHtml = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
    document.execCommand("insertHTML", false, imgHtml);
    updateEditorStats();
    triggerAutoSave();
  }

  function showImagePopover() {
    hideLinkPopover();
    savedSelectionRange = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).cloneRange() : null;
    imageInsertPopover.classList.remove("hidden");
    imageUrlInput.value = "";
    imageUrlInput.focus();
  }

  function hideImagePopover() {
    imageInsertPopover.classList.add("hidden");
    imageUrlInput.value = "";
  }

  function handleImageFileUpload(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      insertImageElement(e.target.result, file.name || "Uploaded Image");
      hideImagePopover();
      showToast("Image inserted");
    };
    reader.readAsDataURL(file);
  }

  // Drag and Drop Image Listener
  editorBodyWrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    editorBodyWrapper.classList.add("drag-over");
  });

  editorBodyWrapper.addEventListener("dragleave", (e) => {
    if (!editorBodyWrapper.contains(e.relatedTarget)) {
      editorBodyWrapper.classList.remove("drag-over");
    }
  });

  editorBodyWrapper.addEventListener("drop", (e) => {
    e.preventDefault();
    editorBodyWrapper.classList.remove("drag-over");

    // 1. Dropped Files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleImageFileUpload(file);
        return;
      }
    }

    // 2. Dropped Image URL / Text
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"))) {
      insertImageElement(url, "Dropped Image");
      showToast("Image inserted");
    }
  });

  // Paste Image Listener
  noteRichEditor.addEventListener("paste", (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        handleImageFileUpload(blob);
        return;
      }
    }
  });

  // Interactive Task Checkbox clicks inside editor
  noteRichEditor.addEventListener("change", (e) => {
    if (e.target && e.target.classList.contains("task-checkbox")) {
      const taskItem = e.target.closest(".task-list-item");
      if (taskItem) {
        taskItem.classList.toggle("task-done", e.target.checked);
        updateEditorStats();
        triggerAutoSave();
      }
    }
  });

  // 12. Event Listeners Wiring

  // List View Buttons
  btnCreateNote.addEventListener("click", () => openNoteWriter());
  btnDeleteNotes.addEventListener("click", handleDeleteSelectedNotes);

  // Editor View Buttons
  btnEditorBack.addEventListener("click", () => closeNoteWriter(true));
  btnEditorSave.addEventListener("click", () => saveCurrentEditorNote(true));

  // Editor typing updates & automatic saving
  noteRichEditor.addEventListener("input", () => {
    updateEditorStats();
    triggerAutoSave();
  });
  editorTitleInput.addEventListener("input", () => {
    triggerAutoSave();
  });

  // Selection change listeners for Floating Bubble Toolbar
  document.addEventListener("selectionchange", () => {
    if (editorSubview.classList.contains("active")) {
      updateBubbleToolbarPosition();
    }
  });

  noteRichEditor.addEventListener("mouseup", () => {
    setTimeout(updateBubbleToolbarPosition, 10);
  });

  noteRichEditor.addEventListener("keyup", () => {
    setTimeout(updateBubbleToolbarPosition, 10);
  });

  // Heading Select Dropdown Handler
  if (bubbleHeadingSelect) {
    bubbleHeadingSelect.addEventListener("mousedown", () => {
      savedSelectionRange = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).cloneRange() : null;
    });

    bubbleHeadingSelect.addEventListener("change", (e) => {
      const tag = e.target.value;
      noteRichEditor.focus();
      restoreSavedSelection();
      document.execCommand("formatBlock", false, `<${tag}>`);
      updateEditorStats();
      triggerAutoSave();
      setTimeout(updateBubbleToolbarPosition, 10);
    });
  }

  // Toolbar Button Click Handlers (Prevent losing text selection on mousedown)
  bubbleToolbar.querySelectorAll(".bubble-btn[data-cmd]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      executeFormat(btn.dataset.cmd);
    });
  });

  // Link button on toolbar
  btnBubbleLink.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (linkInsertPopover.classList.contains("hidden")) {
      showLinkPopover();
    } else {
      hideLinkPopover();
    }
  });

  // Link Popover Buttons
  btnConfirmLinkUrl.addEventListener("click", () => {
    const url = linkUrlInput.value.trim();
    if (!url) {
      showToast("Please enter a URL");
      return;
    }
    insertLinkElement(url);
    hideLinkPopover();
    showToast("Link inserted");
  });

  linkUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnConfirmLinkUrl.click();
    } else if (e.key === "Escape") {
      hideLinkPopover();
    }
  });

  btnCancelLinkPopover.addEventListener("click", hideLinkPopover);

  // Image button on toolbar
  btnBubbleImage.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (imageInsertPopover.classList.contains("hidden")) {
      showImagePopover();
    } else {
      hideImagePopover();
    }
  });

  // Image Popover Buttons
  btnConfirmImageUrl.addEventListener("click", () => {
    const url = imageUrlInput.value.trim();
    if (!url) {
      showToast("Please enter an image URL");
      return;
    }
    insertImageElement(url, "Image");
    hideImagePopover();
    showToast("Image inserted");
  });

  imageUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnConfirmImageUrl.click();
    } else if (e.key === "Escape") {
      hideImagePopover();
    }
  });

  btnBrowseImageFile.addEventListener("click", () => {
    editorImageFileInput.click();
  });

  editorImageFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFileUpload(e.target.files[0]);
      e.target.value = "";
    }
  });

  btnCancelImagePopover.addEventListener("click", hideImagePopover);

  // Keyboard shortcut inside editor: Ctrl/Cmd + S to save
  editorSubview.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveCurrentEditorNote(true);
    }
  });

  // Message Listener from Content Script (Webpage Selection Copy to Draft)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "APPEND_TO_DRAFT" && event.data.text) {
      const textToAppend = event.data.text.trim();
      if (!textToAppend) return;

      if (!editorSubview.classList.contains("active")) {
        openNoteWriter();
      }

      // Append text as a new paragraph block
      const p = document.createElement("p");
      p.textContent = textToAppend;
      noteRichEditor.appendChild(p);

      updateEditorStats();
      triggerAutoSave();
      showToast("Copied to draft note");
    }
  });

  // Utility
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
      if (area === "local" && changes.notes) {
        const newNotes = Array.isArray(changes.notes.newValue) ? changes.notes.newValue : [];
        notes = newNotes;

        // 1. If list subview is active, re-render list
        if (listSubview.classList.contains("active")) {
          renderNotesList();
        }

        // 2. If editor subview is active, sync current editing note
        if (editorSubview.classList.contains("active") && currentEditingNote) {
          const matching = notes.find((n) => n.id === currentEditingNote.id);
          if (matching) {
            currentEditingNote = matching;
            const isEditingTitle = (document.activeElement === editorTitleInput);
            const isEditingEditor = (document.activeElement === noteRichEditor || noteRichEditor.contains(document.activeElement));

            if (!isEditingTitle && editorTitleInput.value !== (matching.title || "")) {
              editorTitleInput.value = matching.title || "";
            }

            if (!isEditingEditor) {
              const newHtml = markdownToHtml(matching.content || "");
              if (noteRichEditor.innerHTML !== newHtml) {
                noteRichEditor.innerHTML = newHtml;
              }
            }

            updateEditorStats();
            editorSaveIndicator.textContent = "Saved";
          } else {
            // Note was deleted in another tab
            closeNoteWriter(false);
            showToast("Note was deleted in another tab");
          }
        }
      }
    });
  }

  // Initial Load
  loadNotes();

  return {
    show: () => {
      panel.classList.add("active");
      if (!editorSubview.classList.contains("active")) {
        loadNotes();
      }
    },
    hide: () => panel.classList.remove("active")
  };
}
