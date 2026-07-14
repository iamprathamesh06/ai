/**
 * dictation.js — Renderer Speech
 * Orchestrator module that exposes a unified toggleDictation function,
 * routing to the generic incremental MediaRecorder speech logic.
 */

import { state } from '../state.js';
import { startRecording, stopRecording } from './stt.js';

export function toggleDictation(updateCharCount) {
  if (state.isRecording) {
    stopRecording();
  } else {
    startRecording(updateCharCount);
  }
}

