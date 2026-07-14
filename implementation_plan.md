# Kyro — Clean Module Architecture Refactor

## Goal

Break the monolithic `renderer.js` (913 lines) and `main.js` (441 lines) into a clean, scalable module structure that makes adding future features trivial and each layer independently testable.

---

## Current Pain Points

| Problem | Impact |
|---|---|
| Single 913-line `renderer.js` | Hard to find things, risky to edit |
| Global state scattered everywhere | Bugs when features interact |
| API logic mixed into UI event handlers | Impossible to reuse or swap providers |
| `main.js` mixes window creation, IPC, API calls, config | Can't add features without touching everything |
| No separation between Electron & browser paths at the module level | Future features need `if (isElectron)` everywhere |

---

## Proposed File Structure

```
d:\Applications\Kyro\
│
├── main.js                      ← slimmed down: app lifecycle + IPC registration only
│
├── preload.js                   ← unchanged (already clean)
│
├── server.js                    ← unchanged
│
├── index.html                   ← unchanged (just loads renderer/app.js)
│
├── style.css                    ← unchanged
│
│── src/
│   │
│   ├── main/                    ← Electron main-process modules
│   │   ├── config-manager.js    ← load/save config + safeStorage key management
│   │   ├── ai-handler.js        ← all HTTPS AI proxy calls (Gemini/OpenAI/Groq)
│   │   ├── ipc-handlers.js      ← registers ALL ipcMain.handle() listeners
│   │   └── window-manager.js   ← createWindow, tray, global shortcuts
│   │
│   └── renderer/               ← Browser/Electron renderer-process modules
│       ├── app.js               ← entry point: imports modules, calls init()
│       ├── state.js             ← single source of truth for all global state
│       ├── config.js            ← load/save config (wraps Electron IPC or localStorage)
│       ├── api.js               ← AI text generation (Electron IPC or browser fetch)
│       ├── speech/
│       │   ├── dictation.js     ← unified toggleDictation + Electron/browser routing
│       │   ├── electron-stt.js  ← MediaRecorder + rolling STT (Electron)
│       │   ├── browser-stt.js   ← Web Speech API (Browser)
│       │   └── synthesis.js     ← TTS / speak toggle / cleanMarkdown
│       ├── ui/
│       │   ├── dom.js           ← all getElementById calls (single place)
│       │   ├── settings-modal.js← modal open/close/save/provider-tabs logic
│       │   └── answer-panel.js  ← render markdown, highlight, copy, speak toggle
│       └── events.js            ← wires all DOM event listeners to module fns
```

---

## Key Design Decisions

### 1. No Build Tools Required
All renderer modules use **plain `<script type="module">` ES modules** — supported in both Electron (Chromium) and modern browsers. Zero webpack/bundler needed. Just change `index.html` to load `src/renderer/app.js` as a module.

### 2. `state.js` — Single Source of Truth
One exported object holds `activeConfig`, `currentResponseText`, `isRecording`, `isMockMode`, `isElectron`. All modules import from it. No more scattered `let` globals.

### 3. `config.js` — Environment Abstraction
Exports `loadConfig()` and `saveConfig()`. Internally uses `window.electron.*` in Electron or `localStorage` in browser. Callers don't care which.

### 4. `api.js` — Provider Abstraction  
Exports `sendAiRequest(question)`. Reads provider/model from state, routes to Electron IPC or direct browser fetch. Adding a new provider = add one `else if` block here only.

### 5. `speech/` — Fully Split by Concern
- `electron-stt.js` owns the MediaRecorder + rolling Whisper logic entirely
- `browser-stt.js` owns the Web Speech Recognition API entirely
- `dictation.js` just picks which one to use based on `state.isElectron`
- `synthesis.js` owns TTS — easy to extend (e.g. ElevenLabs later)

### 6. Main Process Split
`main.js` becomes just the entry (app lifecycle). Each concern has its own file in `src/main/`:
- `config-manager.js` — file I/O + safeStorage (currently inline in main.js)
- `ai-handler.js` — the HTTPS proxy (currently inline in main.js)
- `ipc-handlers.js` — all `ipcMain.handle()` calls
- `window-manager.js` — window + tray + shortcuts

---

## What Changes in `index.html`

```diff
- <script src="renderer.js"></script>
+ <script type="module" src="src/renderer/app.js"></script>
```

That's the only HTML change.

---

## Verification Plan

### After Refactor
- `npm start` (Electron) — all existing features work identically
- `npm run start:web` (Browser) — all features work identically  
- Mic button works in both environments
- Settings save/load works
- AI answer generation works
- TTS speak works

### No regressions — the refactor is purely structural (move code, don't change logic).

---

## Open Questions

> [!IMPORTANT]
> **Do you want `package.json` updated** to use ES module format (`"type": "module"`)? This would affect `main.js` and `server.js` (Node.js files) which would need `import` syntax instead of `require`. Alternatively, we keep `require()` in the main process files and only use ES module `import/export` in the renderer modules (the simpler approach, and what I recommend).

> [!NOTE]
> The `configs/` directory in the project — should anything from there be folded into `src/main/config-manager.js`? Please share what's in it if relevant.
