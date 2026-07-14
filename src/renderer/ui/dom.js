/**
 * dom.js — Renderer
 * Single entry point for all DOM elements to avoid global selectors scattered everywhere.
 */

export const dom = {
  // Environment Badge
  envBadge: document.getElementById('env-badge'),

  // Window Controls
  winMinBtn:   document.getElementById('win-min-btn'),
  winMaxBtn:   document.getElementById('win-max-btn'),
  winCloseBtn: document.getElementById('win-close-btn'),

  // Input Panel
  qInput:    document.getElementById('question-input'),
  micBtn:    document.getElementById('mic-btn'),
  pasteBtn:  document.getElementById('paste-btn'),
  clearBtn:  document.getElementById('clear-btn'),
  cCount:    document.getElementById('char-count'),
  submitBtn: document.getElementById('submit-btn'),

  // Answer Panel
  answerContent: document.getElementById('answer-content'),
  loadingState:  document.getElementById('loading-state'),
  speakBtn:      document.getElementById('speak-btn'),
  speakIcon:     document.getElementById('speak-icon'),
  speakText:     document.getElementById('speak-text'),
  copyBtn:       document.getElementById('copy-btn'),
  speedSelect:   document.getElementById('speed-select'),

  // Status & Footer
  statusIndicator: document.getElementById('status-indicator'),
  statusLight:     document.getElementById('status-indicator'),
  statusText:      document.getElementById('status-text'),
  settingsTrigger: document.getElementById('settings-trigger'),
  stealthTrigger:  document.getElementById('stealth-trigger'),
  stealthIcon:     document.getElementById('stealth-icon'),
  stealthText:     document.getElementById('stealth-text'),

  // Settings Modal
  settingsModal:            document.getElementById('settings-modal'),
  modalCloseBtn:            document.getElementById('modal-close-btn'),
  apiKeyInput:              document.getElementById('api-key-input'),
  togglePasswordVisibility: document.getElementById('toggle-password-visibility'),
  passwordEyeIcon:          document.getElementById('password-eye-icon'),
  modelSelect:              document.getElementById('model-select'),
  systemPromptInput:        document.getElementById('system-prompt-input'),
  settingsCancelBtn:        document.getElementById('settings-cancel-btn'),
  settingsSaveBtn:          document.getElementById('settings-save-btn'),
  providerTabs:             document.querySelectorAll('.provider-tab')
};
