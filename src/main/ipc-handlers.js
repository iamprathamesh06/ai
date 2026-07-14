/**
 * ipc-handlers.js — Main Process
 * Registers all ipcMain listeners. Each handler delegates to the
 * appropriate module — no business logic lives here.
 */

'use strict';

const { ipcMain } = require('electron');
const configManager = require('./config-manager');
const aiHandler     = require('./ai-handler');
const windowManager = require('./window-manager');

let _isMockMode = false;

function register(isMockMode) {
  _isMockMode = isMockMode;

  // ── Window controls ────────────────────────────────────────────────────────
  ipcMain.on('window-minimize', () => windowManager.getMainWindow()?.minimize());

  ipcMain.on('window-maximize', () => {
    const win = windowManager.getMainWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });

  ipcMain.on('window-close', () => windowManager.getMainWindow()?.hide());

  // ── Config / key management ────────────────────────────────────────────────
  ipcMain.handle('get-config', () => configManager.getFullConfig());

  ipcMain.handle('save-config', (_event, partial) => {
    configManager.updateConfig(partial);
    return true;
  });

  ipcMain.handle('save-api-key', (_event, { provider, key }) => {
    configManager.encryptAndSaveKey(provider, key);
    return true;
  });

  ipcMain.handle('get-api-key-decrypted', (_event, provider) =>
    configManager.getDecryptedKey(provider)
  );

  // ── Environment ────────────────────────────────────────────────────────────
  ipcMain.handle('is-mock-mode', () => _isMockMode);

  // ── AI requests ────────────────────────────────────────────────────────────
  ipcMain.handle('send-ai-request', (_event, payload) =>
    aiHandler.handleAiRequest(payload, _isMockMode)
  );

  // ── Invisible Mode ─────────────────────────────────────────────────────────
  ipcMain.handle('toggle-invisible-mode', () => {
    return windowManager.toggleInvisibleMode();
  });
  
  // ── DevTools ───────────────────────────────────────────────────────────────
  ipcMain.handle('toggle-dev-tools', () => {
    const win = windowManager.getMainWindow();
    if (win) win.webContents.toggleDevTools();
  });
}

module.exports = { register };
