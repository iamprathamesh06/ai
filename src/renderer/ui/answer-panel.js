/**
 * answer-panel.js — Renderer UI
 * Manages input validation, AI submission lifecycle, rendering markdown responses,
 * syntax highlighting, copy-to-clipboard, and loading states.
 */

import { state }            from '../state.js';
import { dom }              from './dom.js';
import { sendAiRequest }    from '../api.js';
import { handleSpeakToggle, setSpeakState } from '../speech/synthesis.js';
import { stopRecording }    from '../speech/stt.js';

export async function submitQuestion(updateCharCount) {
  const question = dom.qInput.value.trim();
  if (!question) return;

  // Stop recording dictation if active
  if (state.isRecording) {
    stopRecording();
  }
  
  // Stop speaking previous answer
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    setSpeakState(false);
  }

  // Set Loading UI States
  dom.submitBtn.disabled = true;
  dom.qInput.disabled = true;
  dom.answerContent.innerHTML = '';
  dom.loadingState.classList.remove('hidden');
  dom.speakBtn.disabled = true;
  dom.copyBtn.disabled = true;

  try {
    const resultText = await sendAiRequest(question);
    state.currentResponseText = resultText;
    
    // Render Markdown output
    if (typeof marked !== 'undefined') {
      dom.answerContent.innerHTML = marked.parse(resultText);
    } else {
      dom.answerContent.innerText = resultText;
    }

    // Highlight code blocks
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(dom.answerContent);
    }

    // Enable utilities
    dom.speakBtn.disabled = false;
    dom.copyBtn.disabled = false;

    // Automatically speak the response
    handleSpeakToggle();

  } catch (err) {
    console.error('Submission failed:', err);
    dom.answerContent.innerHTML = `
      <div class="placeholder-state" style="color: var(--danger)">
        <i data-lucide="alert-triangle" style="width:40px; height:40px; stroke: var(--danger);"></i>
        <h3 style="color: var(--danger)">Unable to Generate Answer</h3>
        <p>${err.message}</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } finally {
    dom.loadingState.classList.add('hidden');
    dom.submitBtn.disabled = false;
    dom.qInput.disabled = false;
  }
}

export function copyToClipboard() {
  if (!state.currentResponseText) return;
  navigator.clipboard.writeText(state.currentResponseText).then(() => {
    const copyTextEl = dom.copyBtn.querySelector('span');
    const prevText = copyTextEl.innerText;
    copyTextEl.innerText = 'Copied!';
    setTimeout(() => {
      copyTextEl.innerText = prevText;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
}
