// Background Service Worker for Sidebar Extension

// Handle clicking the extension action icon in the toolbar
// Handle clicking the extension action icon in the toolbar
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  // Ignore restricted browser internal URLs
  if (
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("https://chromewebstore.google.com") ||
    tab.url.startsWith("https://chrome.google.com/webstore")
  ) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SIDEBAR" });
  } catch (err) {
    // If content script is not yet injected on existing tab, inject it
    if (chrome.scripting && chrome.scripting.executeScript) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SIDEBAR" }).catch(() => {});
        }, 300);
      } catch (e) {
        console.warn("Could not inject script into tab:", e.message || e);
      }
    }
  }
});

// Handle LLM calls from content scripts to bypass web page CSP limits (e.g., WhatsApp Web)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CALL_LLM") {
    handleLlmCall(message)
      .then((resultText) => sendResponse({ success: true, text: resultText }))
      .catch((err) => sendResponse({ success: false, error: err.message || "Failed to generate AI response." }));
    return true; // Keep message channel open for async response
  }
});

async function handleLlmCall({ selectedText, instruction }) {
  const data = await new Promise((resolve) => chrome.storage.local.get(null, resolve));
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
    throw new Error(`API key missing for ${provider.toUpperCase()}. Please configure it in NoteAI Settings.`);
  }

  const prompt = `Instruction: ${instruction}\nText to modify:\n"${selectedText}"\n\nReturn ONLY the final modified replacement text. Do NOT wrap in extra quotes or add explanations.`;

  if (provider === "openai" || provider === "groq") {
    const endpoint = provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are an expert writing assistant. You transform text strictly according to the instruction. Return ONLY the transformed replacement text." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API HTTP ${res.status}: ${res.statusText}`);
    }

    const resData = await res.json();
    return (resData.choices?.[0]?.message?.content || "").trim();
  } else if (provider === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        system: "You are an expert writing assistant. Return ONLY the transformed replacement text.",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Claude API HTTP ${res.status}: ${res.statusText}`);
    }

    const resData = await res.json();
    return (resData.content?.[0]?.text || "").trim();
  }
}
