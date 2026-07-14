const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Window Control Channels
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Configuration Settings & Encrypted Keys Channels
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (newConfig) => ipcRenderer.invoke('save-config', newConfig),
  saveApiKey: (provider, key) => ipcRenderer.invoke('save-api-key', { provider, key }),
  getDecryptedKey: (provider) => ipcRenderer.invoke('get-api-key-decrypted', provider),
  
  // Proxied AI Queries
  sendAiRequest: (payload) => ipcRenderer.invoke('send-ai-request', payload),
  
  // State Environment Channels
  isMockMode: () => ipcRenderer.invoke('is-mock-mode'),
  
  // Invisible Mode (Screen Share Protection)
  toggleInvisibleMode: () => ipcRenderer.invoke('toggle-invisible-mode'),
  onInvisibleModeChanged: (callback) => ipcRenderer.on('invisible-mode-changed', (_event, state) => callback(state)),
  
  // DevTools
  toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools')
});
