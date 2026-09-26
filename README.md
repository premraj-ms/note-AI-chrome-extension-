# NoteAI - Chrome Sidebar Extension

A sleek Chrome extension (Manifest V3) that docks as a sidebar on the **right side of your screen covering 20% of the screen width**, while smoothly **resizing and reflowing the host website into the remaining 80%**.

---

## ✨ Features

- **20% Screen Width Dock**: Opens on the right side of the screen (`20vw` with responsive fallback) without overlapping content.
- **Host Page Reflow**: The active website smoothly reflows to occupy the remaining 80% screen space without horizontal scroll cutoff.
- **Interactive Notes List**:
  - All written notes listed as cards with titles, previews, timestamps, tags, and origin links.
  - Pinning notes to top (⭐).
  - Quick note search (by title, body, tag, or domain).
  - Category filter tabs (`All`, `Pinned`, `Clipped`, `Idea`, `Todo`, `Work`).
  - Copy note content to clipboard with 1-click.
  - Double-click or click edit to update notes.
- **Automatic Page & Selection Context**:
  - Automatically captures the current tab URL & page title to associate with new notes.
  - Right-click context menu option: **"Save selection to NoteAI"** clips selected text directly into notes.
  - Right-click context menu option: **"Bookmark page to NoteAI"**.
- **Collapsible Toggle Tab**: Floating handle on the right edge of any webpage + keyboard shortcut (`Alt + N` / `Option + N`).
- **Export & Storage**:
  - Persistent storage using `chrome.storage.local`.
  - Export notes to Markdown (`.md`) or JSON.

---

## 🚀 How to Install & Run in Chrome

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions/` in the URL bar.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the project folder:
   ```
   /Users/premrajms/Desktop/chrome extention/NoteAI-extention
   ```
6. The **NoteAI** extension will now be loaded!

---

## 💡 How to Use

- **Toggle Sidebar**:
  - Click the **NoteAI** icon in your Chrome toolbar.
  - Or click the floating **Notes** button on the right edge of any web page.
  - Or press `Alt + N` (or `Option + N` on macOS).
- **Add Notes**:
  - Click the **`+`** button in the sidebar header to open the editor.
  - Select tags (Idea, Todo, Work, etc.) and color accents.
  - Click **Save Note** or press `Ctrl + Enter` / `Cmd + Enter`.
- **Clip Web Text**:
  - Highlight any text on a web page, right-click, and select **"Save selection to NoteAI"**.
