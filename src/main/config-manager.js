/**
 * config-manager.js — Main Process
 * Handles all config file I/O and safeStorage-based API key encryption.
 */

'use strict';

const { safeStorage } = require('electron');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

const DEFAULTS = {
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  systemPrompt:
    'You are an expert interviewer. Provide concise, constructive, and structured answers suitable for a live verbal interview scenario. Highlight key terms and write clean code examples if applicable.'
};

// ─── File I/O ────────────────────────────────────────────────────────────────

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[config-manager] Failed to load config:', err);
  }
  return {};
}

function saveConfig(data) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[config-manager] Failed to save config:', err);
  }
}

// ─── Key Encryption ──────────────────────────────────────────────────────────

function getDecryptedKey(provider) {
  const fileData = loadConfig();
  const hexKey = fileData[`${provider}Key`];
  if (!hexKey) return '';
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(hexKey, 'hex'));
    }
    return Buffer.from(hexKey, 'base64').toString('utf8');
  } catch (err) {
    console.error(`[config-manager] Failed to decrypt key for ${provider}:`, err);
    return '';
  }
}

function encryptAndSaveKey(provider, rawKey) {
  const fileData = loadConfig();
  if (!rawKey) {
    delete fileData[`${provider}Key`];
    saveConfig(fileData);
    return;
  }
  try {
    let encryptedHex;
    if (safeStorage.isEncryptionAvailable()) {
      encryptedHex = safeStorage.encryptString(rawKey).toString('hex');
    } else {
      encryptedHex = Buffer.from(rawKey, 'utf8').toString('base64');
    }
    fileData[`${provider}Key`] = encryptedHex;
    saveConfig(fileData);
  } catch (err) {
    console.error(`[config-manager] Failed to encrypt key for ${provider}:`, err);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the full config object merged with defaults.
 * Also includes hasXxxKey flags for each known provider.
 */
function getFullConfig() {
  const fileData = loadConfig();
  return {
    provider:     fileData.provider     || DEFAULTS.provider,
    model:        fileData.model        || DEFAULTS.model,
    systemPrompt: fileData.systemPrompt || DEFAULTS.systemPrompt,
    hasGeminiKey: !!fileData.geminiKey,
    hasOpenaiKey: !!fileData.openaiKey,
    hasGroqKey:   !!fileData.groqKey
  };
}

/**
 * Merges partial config fields into the persisted file.
 */
function updateConfig(partial) {
  const fileData = loadConfig();
  Object.assign(fileData, partial);
  saveConfig(fileData);
}

module.exports = {
  DEFAULTS,
  loadConfig,
  saveConfig,
  getFullConfig,
  updateConfig,
  getDecryptedKey,
  encryptAndSaveKey
};
