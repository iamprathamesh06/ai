/**
 * settings-modal.js — Renderer UI
 * Manages the settings modal open, close, and save logic.
 */

import { state }                  from '../state.js';
import { dom }                    from './dom.js';
import { populateModelDropdown }  from '../config.js';
import { saveConfig }             from '../config.js';

export async function openSettings() {
  const providerName = state.activeConfig.provider === 'gemini' ? 'Gemini' : (state.activeConfig.provider === 'openai' ? 'OpenAI' : 'Groq');
  
  if (state.isElectron) {
    const savedConfig = await window.electron.getConfig();
    state.activeConfig.provider     = savedConfig.provider;
    state.activeConfig.model        = savedConfig.model;
    state.activeConfig.systemPrompt = savedConfig.systemPrompt;
    dom.apiKeyInput.value = ''; // Don't show encrypted API key value for security
    
    const providerKeyField = `has${state.activeConfig.provider.charAt(0).toUpperCase() + state.activeConfig.provider.slice(1)}Key`;
    const hasKey = !!savedConfig[providerKeyField];
    
    dom.apiKeyInput.placeholder = hasKey ? '••••••••••••••••••••••••' : `Enter ${providerName} API key...`;
  } else {
    const savedKey = localStorage.getItem(`api_key_${state.activeConfig.provider}`) || '';
    dom.apiKeyInput.value = savedKey;
    dom.apiKeyInput.placeholder = `Enter ${providerName} API key...`;
  }

  dom.systemPromptInput.value = state.activeConfig.systemPrompt;
  populateModelDropdown(state.activeConfig.provider);
  dom.modelSelect.value = state.activeConfig.model;
  
  // Set active provider tab style
  dom.providerTabs.forEach(tab => {
    if (tab.getAttribute('data-provider') === state.activeConfig.provider) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  dom.settingsModal.classList.remove('hidden');
}

export function closeSettings() {
  dom.settingsModal.classList.add('hidden');
  dom.apiKeyInput.value = '';
  // Hide password characters
  dom.apiKeyInput.type = 'password';
  dom.passwordEyeIcon.setAttribute('data-lucide', 'eye');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

export async function handleSettingsSave() {
  const selectedTab = document.querySelector('.provider-tab.active');
  const provider = selectedTab.getAttribute('data-provider');
  const model = dom.modelSelect.value;
  const systemPrompt = dom.systemPromptInput.value.trim();
  const rawKey = dom.apiKeyInput.value.trim();

  await saveConfig({
    provider,
    model,
    systemPrompt,
    rawKey
  });

  closeSettings();
}

export function switchSettingsProvider(tabElement) {
  dom.providerTabs.forEach(t => t.classList.remove('active'));
  tabElement.classList.add('active');
  const provider = tabElement.getAttribute('data-provider');
  
  // Update models list
  populateModelDropdown(provider);
  
  // Update key inputs display
  const providerName = provider === 'gemini' ? 'Gemini' : (provider === 'openai' ? 'OpenAI' : 'Groq');
  if (state.isElectron) {
    window.electron.getConfig().then(cfg => {
      const providerKeyField = `has${provider.charAt(0).toUpperCase() + provider.slice(1)}Key`;
      const hasKey = !!cfg[providerKeyField];
      dom.apiKeyInput.value = '';
      dom.apiKeyInput.placeholder = hasKey ? '••••••••••••••••••••••••' : `Enter ${providerName} API key...`;
    });
  } else {
    const savedKey = localStorage.getItem(`api_key_${provider}`) || '';
    dom.apiKeyInput.value = savedKey;
    dom.apiKeyInput.placeholder = `Enter ${providerName} API key...`;
  }
}
