/**
 * config.js — Renderer
 * Loads and saves app configuration.
 * Abstracts the Electron IPC vs localStorage difference so callers don't care.
 */

import { state, PROVIDER_MODELS } from './state.js';
import { dom }                    from './ui/dom.js';

// ─── Load ────────────────────────────────────────────────────────────────────

export async function loadAndApplyConfig() {
  if (state.isElectron) {
    const saved = await window.electron.getConfig();
    state.activeConfig.provider     = saved.provider;
    state.activeConfig.model        = saved.model;
    state.activeConfig.systemPrompt = saved.systemPrompt;

    const keyField = `has${capitalise(saved.provider)}Key`;
    updateStatusDisplay(!!saved[keyField], state.isMockMode);
  } else {
    const raw = localStorage.getItem('interview_ai_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state.activeConfig.provider     = parsed.provider     || state.activeConfig.provider;
        state.activeConfig.model        = parsed.model        || state.activeConfig.model;
        state.activeConfig.systemPrompt = parsed.systemPrompt || state.activeConfig.systemPrompt;
      } catch (e) {
        console.error('[config] Failed to parse web config:', e);
      }
    }
    const savedKey = localStorage.getItem(`api_key_${state.activeConfig.provider}`);
    updateStatusDisplay(!!savedKey, false);
  }

  // Reflect loaded values into settings UI
  dom.systemPromptInput.value = state.activeConfig.systemPrompt;
  populateModelDropdown(state.activeConfig.provider);
  dom.modelSelect.value = state.activeConfig.model;
}

// ─── Save ────────────────────────────────────────────────────────────────────

export async function saveConfig({ provider, model, systemPrompt, rawKey }) {
  state.activeConfig.provider     = provider;
  state.activeConfig.model        = model;
  state.activeConfig.systemPrompt = systemPrompt;

  if (state.isElectron) {
    await window.electron.saveConfig({ provider, model, systemPrompt });
    if (rawKey && rawKey !== '••••••••••••••••••••••••') {
      await window.electron.saveApiKey(provider, rawKey);
    }
  } else {
    localStorage.setItem('interview_ai_config', JSON.stringify({ provider, model, systemPrompt }));
    if (rawKey) {
      localStorage.setItem(`api_key_${provider}`, rawKey);
    }
  }

  await loadAndApplyConfig();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function updateStatusDisplay(hasKey, mockMode) {
  if (mockMode) {
    dom.statusLight.className = 'status-light mock';
    dom.statusText.innerText  = 'Connected (Local Mock API)';
    return;
  }

  const label = { gemini: 'Gemini', openai: 'OpenAI', groq: 'Groq' }[state.activeConfig.provider] || state.activeConfig.provider;

  if (hasKey) {
    dom.statusLight.className = 'status-light connected';
    dom.statusText.innerText  = `Connected (${label})`;
  } else {
    dom.statusLight.className = 'status-light disconnected';
    dom.statusText.innerText  = `Disconnected (No API Key for ${label})`;
  }
}

export function populateModelDropdown(provider) {
  dom.modelSelect.innerHTML = '';
  (PROVIDER_MODELS[provider] || []).forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value     = value;
    opt.innerText = label;
    dom.modelSelect.appendChild(opt);
  });
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
