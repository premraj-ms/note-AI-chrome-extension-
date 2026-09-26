// Markdown <-> HTML Converter Utility

export function stripMarkdown(md = "") {
  if (!md) return "";
  return md
    .replace(/^#+\s+/gm, "")
    .replace(/^-\s*\[x\]\s+/gim, "☑ ")
    .replace(/^-\s*\[ \]\s+/gm, "☐ ")
    .replace(/\!\[(.*?)\]\(.*?\)/g, "[Image: $1]")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\>\s+/gm, "")
    .replace(/^[\*\-\+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .trim();
}

export function markdownToHtml(md = "") {
  if (!md) return "";

  let text = md;

  // 1. Protect Fenced Code Blocks first
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({
      placeholder,
      lang: lang ? lang.toLowerCase() : "",
      code: escapeHtml(code.trim())
    });
    return placeholder;
  });

  // 2. Protect Inline Code
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push({
      placeholder,
      code: escapeHtml(code)
    });
    return placeholder;
  });

  // 3. Process Tables
  let lines = text.split("\n");
  let processedLines = [];
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\|.*\|$/.test(line)) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue; // Skip separator row
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
    } else {
      if (inTable) {
        processedLines.push(renderTableHtml(tableHeader, tableRows));
        inTable = false;
        tableHeader = [];
        tableRows = [];
      }
      processedLines.push(lines[i]);
    }
  }

  if (inTable) {
    processedLines.push(renderTableHtml(tableHeader, tableRows));
  }

  text = processedLines.join("\n");

  // 4. Horizontal Rules (<hr>)
  text = text.replace(/^\s*(---|[*]{3,}|_{3,})\s*$/gm, '<hr class="markdown-hr">');

  // 5. Process Blockquotes
  lines = text.split("\n");
  let inBlockquote = false;
  let blockquoteContent = [];
  processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bqMatch = line.match(/^\s*>\s?(.*)$/);
    if (bqMatch) {
      inBlockquote = true;
      blockquoteContent.push(bqMatch[1]);
    } else {
      if (inBlockquote) {
        processedLines.push(`<blockquote>${blockquoteContent.join("<br>")}</blockquote>`);
        blockquoteContent = [];
        inBlockquote = false;
      }
      processedLines.push(line);
    }
  }
  if (inBlockquote) {
    processedLines.push(`<blockquote>${blockquoteContent.join("<br>")}</blockquote>`);
  }

  text = processedLines.join("\n");

  // 6. Headings
  text = text.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  text = text.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  text = text.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // 7. Images & Links
  text = text.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />');
  text = text.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');

  // 8. Bold, Italic, Strikethrough
  text = text.replace(/~~(.*?)~~/gim, "<del>$1</del>");
  text = text.replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/gim, "<em>$1</em>");
  text = text.replace(/___(.*?)___/gim, "<strong><em>$1</em></strong>");
  text = text.replace(/__(.*?)__/gim, "<strong>$1</strong>");
  text = text.replace(/_(.*?)_/gim, "<em>$1</em>");

  // 9. Task Checklists
  text = text.replace(
    /^\s*-\s*\[x\]\s+(.*$)/gim,
    '<ul class="task-list"><li class="task-list-item task-done"><input type="checkbox" class="task-checkbox" checked contenteditable="false"><span class="task-text">$1</span></li></ul>'
  );
  text = text.replace(
    /^\s*-\s*\[ \]\s+(.*$)/gim,
    '<ul class="task-list"><li class="task-list-item"><input type="checkbox" class="task-checkbox" contenteditable="false"><span class="task-text">$1</span></li></ul>'
  );
  text = text.replace(/<\/ul>\s*<ul class="task-list">/gim, "");

  // 10. Lists
  text = text.replace(/^\s*-\s+(.*$)/gim, "<ul><li>$1</li></ul>");
  text = text.replace(/<\/ul>\s*<ul>/gim, "");

  text = text.replace(/^\s*\d+\.\s+(.*$)/gim, "<ol><li>$1</li></ol>");
  text = text.replace(/<\/ol>\s*<ol>/gim, "");

  // 11. Isolate block elements onto clean boundaries
  text = text
    .replace(/(<(h[1-6]|ul|ol|blockquote|table|hr)(\s+[^>]*)?>)/gi, "\n\n$1")
    .replace(/(<\/(h[1-6]|ul|ol|blockquote|table)>)/gi, "$1\n\n");

  // 12. Paragraphs / Line Breaks
  const blocks = text.split(/\n\n+/);
  text = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (/^<(h[1-6]|ul|ol|blockquote|img|table|hr|div|pre|__CODE_BLOCK_)/i.test(block)) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  // 13. Restore Fenced Code Blocks & Inline Code
  codeBlocks.forEach(({ placeholder, lang, code }) => {
    const codeHtml = `<div class="code-block-wrapper"><div class="code-block-header"><span>${lang || "code"}</span></div><pre><code>${code}</code></pre></div>`;
    text = text.replace(placeholder, codeHtml);
  });

  inlineCodes.forEach(({ placeholder, code }) => {
    text = text.replace(placeholder, `<code class="inline-code">${code}</code>`);
  });

  return text;
}

function renderTableHtml(headers, rows) {
  let html = `<div class="table-container"><table class="markdown-table">`;
  if (headers && headers.length > 0) {
    html += `<thead><tr>`;
    headers.forEach((h) => {
      html += `<th>${escapeHtml(h)}</th>`;
    });
    html += `</tr></thead>`;
  }
  if (rows && rows.length > 0) {
    html += `<tbody>`;
    rows.forEach((row) => {
      html += `<tr>`;
      row.forEach((cell) => {
        html += `<td>${escapeHtml(cell)}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody>`;
  }
  html += `</table></div>`;
  return html;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function htmlToMarkdown(element) {
  if (!element) return "";

  let md = "";

  function traverse(node) {
    const TEXT_NODE = typeof Node !== "undefined" ? Node.TEXT_NODE : 3;
    const ELEMENT_NODE = typeof Node !== "undefined" ? Node.ELEMENT_NODE : 1;

    if (node.nodeType === TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();

    // Ignore raw checkboxes in text accumulation
    if (tag === "input" && node.getAttribute("type") === "checkbox") {
      return "";
    }

    let inner = "";
    node.childNodes.forEach((child) => {
      inner += traverse(child);
    });

    switch (tag) {
      case "h1":
        return `\n# ${inner.trim()}\n\n`;
      case "h2":
        return `\n## ${inner.trim()}\n\n`;
      case "h3":
        return `\n### ${inner.trim()}\n\n`;
      case "strong":
      case "b":
        return `**${inner}**`;
      case "em":
      case "i":
        return `*${inner}*`;
      case "del":
      case "s":
        return `~~${inner}~~`;
      case "blockquote":
        return `\n> ${inner.trim()}\n\n`;
      case "hr":
        return `\n---\n\n`;
      case "ul":
        return `\n${inner}\n`;
      case "ol":
        return `\n${inner}\n`;
      case "li":
        const isTask = node.classList.contains("task-list-item") || node.querySelector("input.task-checkbox");
        if (isTask) {
          const checkbox = node.querySelector("input.task-checkbox");
          const isChecked = checkbox ? checkbox.checked : node.classList.contains("task-done");
          const cleanText = inner.replace(/^\s*[\u2610\u2611\u2612\u25A1\u25A0]?\s*/, "").trim();
          return `- [${isChecked ? "x" : " "}] ${cleanText}\n`;
        }
        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : "";
        if (parentTag === "ol") {
          const index = Array.from(node.parentElement.children).indexOf(node) + 1;
          return `${index}. ${inner.trim()}\n`;
        }
        return `- ${inner.trim()}\n`;
      case "p":
        return `\n${inner.trim()}\n\n`;
      case "img":
        const alt = node.getAttribute("alt") || "image";
        const src = node.getAttribute("src") || "";
        return `\n![${alt}](${src})\n\n`;
      case "br":
        return "\n";
      case "a":
        const href = node.getAttribute("href") || "#";
        return `[${inner}](${href})`;
      case "div":
        return `\n${inner}\n`;
      case "code":
        return `\`${inner}\``;
      default:
        return inner;
    }
  }

  md = traverse(element);

  // Clean up extra blank lines
  return md
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}



