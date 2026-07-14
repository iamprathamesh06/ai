/**
 * window-manager.js — Main Process
 * Creates and manages the BrowserWindow, system tray, and global shortcuts.
 */

'use strict';

const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let isInvisible = false;
let ghostBounds = null; // Saves window position/size before ghost mode so we can restore exactly

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           950,
    height:          700,
    minWidth:        700,
    minHeight:       500,
    frame:           false,
    transparent:     true, // CRITICAL: Makes window WS_EX_LAYERED, allowing WDA_EXCLUDEFROMCAPTURE to be fully transparent instead of a black box!
    hasShadow:       false,
    webPreferences: {
      preload:          path.join(__dirname, '..', '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false
    },
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

// ─── Tray ────────────────────────────────────────────────────────────────────

function setupTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  const rawIcon  = nativeImage.createFromPath(iconPath);
  const icon     = rawIcon.isEmpty() ? nativeImage.createEmpty() : rawIcon;

  tray = new Tray(icon);
  tray.setToolTip('AI Interview Assistant');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Assistant', click: () => mainWindow?.show() },
    { label: 'Hide Assistant', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Global Shortcuts ────────────────────────────────────────────────────────

function registerGlobalShortcuts() {
  const shortcut = process.platform === 'darwin' ? 'Command+Option+I' : 'Ctrl+Alt+I';
  const invisibleShortcut = process.platform === 'darwin' ? 'Command+Option+S' : 'Ctrl+Alt+S';

  try {
    const ok = globalShortcut.register(shortcut, () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    console.log(ok ? `Global shortcut registered: ${shortcut}` : `Shortcut registration failed: ${shortcut}`);
    
    const ok2 = globalShortcut.register(invisibleShortcut, () => {
      toggleInvisibleMode();
    });
    console.log(ok2 ? `Invisible shortcut registered: ${invisibleShortcut}` : `Invisible shortcut failed: ${invisibleShortcut}`);
  } catch (err) {
    console.error('[window-manager] Failed to register global shortcut:', err);
  }
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

function toggleInvisibleMode() {
  if (!mainWindow) return false;
  isInvisible = !isInvisible;
  
  // OS-LEVEL FIX: setContentProtection(true) maps to WDA_EXCLUDEFROMCAPTURE.
  // When combined with a transparent window (WS_EX_LAYERED), Windows 10/11 DWM 
  // correctly passes the desktop background through instead of drawing a black box!
  mainWindow.setContentProtection(isInvisible);
  
  if (isInvisible) {
    // ── Stealth Mode ON ───────────────────────────────────────────────────────
    mainWindow.setOpacity(1.0); // Keep fully visible to the user
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  } else {
    // ── Stealth Mode OFF ──────────────────────────────────────────────────────
    mainWindow.setAlwaysOnTop(false);
    mainWindow.focus();
  }

  console.log(`Stealth mode: ${isInvisible ? 'ON (OS-level Exclude)' : 'OFF (Normal)'}`);
  mainWindow.webContents.send('invisible-mode-changed', isInvisible);
  return isInvisible;
}

// ─── Quitting ─────────────────────────────────────────────────────────────────


function setQuitting(val) {
  isQuitting = val;
}

module.exports = {
  createWindow,
  getMainWindow,
  setupTray,
  registerGlobalShortcuts,
  unregisterShortcuts,
  toggleInvisibleMode,
  setQuitting
};
