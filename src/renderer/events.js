/**
 * events.js — Renderer
 * Binds DOM event listeners to their respective module functions.
 */

import { state }            from './state.js';
import { dom }              from './ui/dom.js';
import { toggleDictation }  from './speech/dictation.js';
import { handleSpeakToggle }from './speech/synthesis.js';
import { submitQuestion, copyToClipboard } from './ui/answer-panel.js';
import { openSettings, closeSettings, handleSettingsSave, switchSettingsProvider } from './ui/settings-modal.js';

export function updateCharCount() {
  const chars = dom.qInput.value.length;
  dom.cCount.innerText = `${chars} character${chars === 1 ? '' : 's'}`;
}

export function setupEventListeners() {
  // Input triggers
  dom.qInput.addEventListener('input', updateCharCount);
  dom.clearBtn.addEventListener('click', () => {
    dom.qInput.value = '';
    updateCharCount();
    dom.qInput.focus();
  });
  
  dom.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        dom.qInput.value = dom.qInput.value ? `${dom.qInput.value.trim()} ${text}` : text;
        updateCharCount();
        dom.qInput.focus();
      }
    } catch (err) {
      console.warn('Clipboard read permission denied.', err);
    }
  });

  dom.micBtn.addEventListener('click', () => toggleDictation(updateCharCount));
  dom.submitBtn.addEventListener('click', () => submitQuestion(updateCharCount));

  // Keyboard shortcut: Press Ctrl+Enter or Cmd+Enter to submit
  dom.qInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitQuestion(updateCharCount);
    }
  });

  // Action utilities
  dom.speakBtn.addEventListener('click', handleSpeakToggle);
  dom.copyBtn.addEventListener('click', copyToClipboard);

  // Speed controls cancel and restart speech on mid-run adjustments
  dom.speedSelect.addEventListener('change', () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      handleSpeakToggle(); // Restart with new rate
    }
  });

  dom.settingsTrigger.addEventListener('click', openSettings);
  dom.modalCloseBtn.addEventListener('click', closeSettings);
  dom.settingsCancelBtn.addEventListener('click', closeSettings);

  // Close modal clicking outside the modal card
  dom.settingsModal.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) closeSettings();
  });

  // Settings Save operation
  dom.settingsSaveBtn.addEventListener('click', handleSettingsSave);

  // Settings Modal Switch Providers
  dom.providerTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      switchSettingsProvider(e.currentTarget);
    });
  });

  // Toggle API key visibility (password/text)
  dom.togglePasswordVisibility.addEventListener('click', () => {
    if (dom.apiKeyInput.type === 'password') {
      dom.apiKeyInput.type = 'text';
      dom.passwordEyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      dom.apiKeyInput.type = 'password';
      dom.passwordEyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // ─── Desktop Titlebar Window Controls (Electron only) ──────────────────────
  if (state.isElectron) {
    dom.winMinBtn.addEventListener('click', () => {
      window.electron.minimize();
    });
    dom.winMaxBtn.addEventListener('click', () => {
      window.electron.maximize();
    });
    dom.winCloseBtn.addEventListener('click', () => {
      window.electron.close();
    });

    // Stealth / Invisible Mode
    dom.stealthTrigger.addEventListener('click', async () => {
      if (window.electron.toggleInvisibleMode) {
        await window.electron.toggleInvisibleMode();
      }
    });

    if (window.electron.onInvisibleModeChanged) {
      window.electron.onInvisibleModeChanged((isInvisible) => {
        if (isInvisible) {
          dom.stealthIcon.setAttribute('data-lucide', 'eye-off');
          dom.stealthText.innerText = 'Invisible: ON';
          dom.stealthTrigger.classList.add('active-stealth');
        } else {
          dom.stealthIcon.setAttribute('data-lucide', 'eye');
          dom.stealthText.innerText = 'Invisible: OFF';
          dom.stealthTrigger.classList.remove('active-stealth');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    }

    // DevTools Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        if (window.electron.toggleDevTools) {
          window.electron.toggleDevTools();
        }
      }
    });
  }
}
