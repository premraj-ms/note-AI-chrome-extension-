// About View Component: Displays developer details

export function initAboutView({ onClose }) {
  const container = document.getElementById("about-view-container");
  if (!container) return;

  container.innerHTML = `
    <section id="about-view" class="view-panel settings-panel">
      <!-- Header -->
      <div class="settings-header">
        <button id="btn-back-about" class="back-btn" type="button" title="Back to Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
        <h3>About Developer</h3>
        <div class="header-right-spacer"></div>
      </div>

      <!-- Body -->
      <div class="settings-scroll-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px;">
        
        <!-- Developer Details Card -->
        <div class="settings-card" style="width: 100%; padding: 32px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; background: linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,0.02)); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          
          <div style="position: relative; margin-bottom: 20px;">
            <img src="https://github.com/premraj-ms.png" alt="Premraj M S" style="width: 110px; height: 110px; border-radius: 50%; border: 4px solid var(--primary-color); object-fit: cover; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
          </div>
          
          <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px;">Premraj M S</h2>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5; max-width: 80%;">Developer & Creator of NoteAI</p>
          
          <!-- Social Links -->
          <div style="display: flex; gap: 14px; width: 100%; justify-content: center;">
            <a href="https://github.com/premraj-ms/" target="_blank" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 10px; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all 0.2s ease;" title="GitHub" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.color='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)'; this.style.transform='translateY(0)';">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            
            <a href="https://www.linkedin.com/in/premraj-ms/" target="_blank" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 10px; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all 0.2s ease;" title="LinkedIn" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.color='#0a66c2'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)'; this.style.transform='translateY(0)';">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            
            <a href="https://www.instagram.com/premraj.ms/" target="_blank" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 10px; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all 0.2s ease;" title="Instagram" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.color='#E1306C'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)'; this.style.transform='translateY(0)';">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

      </div>
    </section>
  `;

  const panel = document.getElementById("about-view");
  const btnBack = document.getElementById("btn-back-about");

  if (btnBack) {
    btnBack.addEventListener("click", (e) => {
      e.preventDefault();
      if (onClose) onClose();
    });
  }

  return {
    show: () => panel.classList.add("active"),
    hide: () => panel.classList.remove("active")
  };
}
