/**
 * main.js — Electron Entry Point
 * Bootstraps the application by delegating to focused modules.
 * Business logic lives in src/main/.
 */

'use strict';

const { app, session } = require('electron');

const ipcHandlers   = require('./src/main/ipc-handlers');
const windowManager = require('./src/main/window-manager');
const configManager = require('./src/main/config-manager');

const isMockMode = process.argv.includes('--mock');

// CRITICAL FIX: Disabling Hardware Acceleration is REQUIRED for setContentProtection
// to work correctly with WGC (Google Meet) on Windows 10/11. Without this, the 
// GPU-accelerated DirectComposition layer forces the DWM to draw a black box over 
// the excluded window. With it disabled, the window renders in software to a GDI 
// bitmap, which the DWM can gracefully exclude transparently!
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  // Load config on startup
  configManager.loadConfig();

  // Grant microphone permission on the default session before any window opens
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'microphone');
  });

  // Cover any future web-contents (e.g. popup windows)
  app.on('web-contents-created', (_event, contents) => {
    contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === 'media' || permission === 'microphone');
    });
  });

  // Register all IPC channels
  ipcHandlers.register(isMockMode);

  // Create UI
  windowManager.createWindow();
  windowManager.setupTray();
  windowManager.registerGlobalShortcuts();

  app.on('activate', () => {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  windowManager.unregisterShortcuts();
});
