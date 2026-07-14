/**
 * app.js — Renderer Entry Point
 * Bootstraps the UI, initialises settings, detects environments, and sets up event listeners.
 */

import { state }                from './state.js';
import { dom }                  from './ui/dom.js';
import { loadAndApplyConfig }   from './config.js';
import { initSpeechSynthesis }  from './speech/synthesis.js';
import { setupEventListeners }  from './events.js';

async function init() {
  // 1. Detect Environment & Apply UI elements
  if (state.isElectron) {
    document.body.classList.add('is-desktop');
    dom.envBadge.innerText = 'Desktop App';
    dom.envBadge.classList.add('desktop-badge');
    
    // Check if running in offline mock-mode
    try {
      state.isMockMode = await window.electron.isMockMode();
    } catch (e) {
      console.warn('Could not determine mock status:', e);
    }
  } else {
    document.body.classList.add('is-web');
    dom.envBadge.innerText = 'Web Browser';
    dom.envBadge.classList.add('web-badge');
  }

  // 2. Load API & system configuration
  await loadAndApplyConfig();

  // 3. Initialise speech engine defaults
  initSpeechSynthesis();

  // 4. Bind event listeners
  setupEventListeners();

  // 5. Initialise Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Boot
window.addEventListener('DOMContentLoaded', init);
