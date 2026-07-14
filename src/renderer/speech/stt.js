/**
 * electron-stt.js — Renderer Speech
 * Handles real-time incremental Speech-to-Text in Electron.
 * Records audio chunks, periodically sends them to the STT API (Whisper/Gemini),
 * and updates the input field dynamically while speaking.
 */

import { state } from '../state.js';
import { dom }   from '../ui/dom.js';

let mediaRecorder = null;
let audioChunks = [];
let incrementalTimer = null;
let lastFinalText = '';
let sttInProgress = false;

// ─── STT API Call ────────────────────────────────────────────────────────────

async function callSTTApi(audioBlob, mimeType) {
  if (state.isMockMode) {
    await new Promise((r) => setTimeout(r, 600));
    return ' [Mock Speech Detected]';
  }

  const provider = state.activeConfig.provider;
  let apiKey = '';
  try {
    if (state.isElectron) {
      apiKey = await window.electron.getDecryptedKey(provider);
    } else {
      apiKey = localStorage.getItem(`api_key_${provider}`);
    }
  } catch (e) {
    console.error('Failed to retrieve API key:', e);
  }
  if (!apiKey) return null;

  const ext = mimeType.includes('webm') ? 'webm' : 'ogg';

  if (provider === 'openai' || provider === 'groq') {
    const endpoint = provider === 'openai'
      ? 'https://api.openai.com/v1/audio/transcriptions'
      : 'https://api.groq.com/openai/v1/audio/transcriptions';
    const model = provider === 'openai' ? 'whisper-1' : 'whisper-large-v3';

    const form = new FormData();
    form.append('file', audioBlob, `audio.${ext}`);
    form.append('model', model);
    form.append('language', 'en');

    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body:    form
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    return json.text?.trim() || '';
  } else {
    // Gemini multimodal audio path
    const base64Audio = await blobToBase64(audioBlob);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType.split(';')[0], data: base64Audio } },
            { text: 'Transcribe this audio exactly as spoken. Return only the spoken words with no extra commentary.' }
          ]
        }]
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Real-time Incremental STT ───────────────────────────────────────────────

async function runIncrementalSTT(updateCharCount) {
  if (audioChunks.length === 0 || sttInProgress) return;

  sttInProgress = true;
  const mimeType = mediaRecorder.mimeType;
  const blobData = new Blob(audioChunks, { type: mimeType });

  try {
    const text = await callSTTApi(blobData, mimeType);
    if (text) {
      dom.qInput.value = lastFinalText ? `${lastFinalText.trim()} ${text.trim()}` : text.trim();
      updateCharCount();
    }
  } catch (err) {
    console.error('Incremental STT error:', err);
  } finally {
    sttInProgress = false;
  }
}

// ─── Recording controls ──────────────────────────────────────────────────────

export async function startRecording(updateCharCount) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose appropriate mime type
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/ogg';
    }

    audioChunks = [];
    lastFinalText = dom.qInput.value;

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      state.isRecording = true;
      dom.micBtn.classList.add('recording');
      dom.qInput.placeholder = 'Listening... Speak clearly into your microphone.';

      // Start periodic incremental STT checks every 1500ms
      incrementalTimer = setInterval(() => {
        runIncrementalSTT(updateCharCount);
      }, 1500);
    };

    mediaRecorder.onstop = async () => {
      state.isRecording = false;
      dom.micBtn.classList.remove('recording');
      dom.qInput.placeholder = 'State your interview question or coding problem here...';

      if (incrementalTimer) {
        clearInterval(incrementalTimer);
        incrementalTimer = null;
      }

      // Run one final transcription block
      await runIncrementalSTT(updateCharCount);

      // Stop all tracks on the audio stream
      stream.getTracks().forEach(track => track.stop());
    };

    // Request audio chunks every 250ms
    mediaRecorder.start(250);

  } catch (err) {
    console.error('Failed to access microphone:', err);
    alert(`Microphone permission / access issue: ${err.message}`);
  }
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
