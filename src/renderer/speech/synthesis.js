/**
 * synthesis.js — Renderer Speech
 * Handles Text-To-Speech (TTS) using the Web Speech Synthesis API.
 */

import { state } from '../state.js';
import { dom }   from '../ui/dom.js';

let speechUtterance = null;

export function initSpeechSynthesis() {
  if (!window.speechSynthesis) {
    console.warn('Speech Synthesis API is not supported in this environment.');
    dom.speakBtn.disabled = true;
    return;
  }
  window.speechSynthesis.cancel(); // Cancel any pending speech on reload
}

export function cleanMarkdownForSpeech(markdown) {
  let text = markdown;
  
  // 1. Remove markdown code blocks (```javascript ... ```)
  text = text.replace(/```[\s\S]*?```/g, ' [code block omitted] ');
  
  // 2. Remove inline code ticks (`const a = 1`)
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // 3. Remove Markdown Headers
  text = text.replace(/^\s*#+\s+/gm, '');
  
  // 4. Remove bold & italic symbols
  text = text.replace(/[*_]/g, '');
  
  // 5. Clean list indicators (dash, bullets, numbers)
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  
  // 6. Clean Markdown Links [Label](URL) -> Label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 7. Limit whitespace
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}

export function handleSpeakToggle() {
  if (!window.speechSynthesis) return;
  
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    setSpeakState(false);
  } else {
    if (!state.currentResponseText) return;
    
    const speakableText = cleanMarkdownForSpeech(state.currentResponseText);
    speechUtterance = new SpeechSynthesisUtterance(speakableText);
    
    const rate = parseFloat(dom.speedSelect.value) || 1.0;
    speechUtterance.rate = rate;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Google')) || 
                        voices.find(voice => voice.lang.startsWith('en-')) || 
                        voices[0];
    if (englishVoice) {
      speechUtterance.voice = englishVoice;
    }

    speechUtterance.onstart = () => setSpeakState(true);
    speechUtterance.onend = () => setSpeakState(false);
    speechUtterance.onerror = () => setSpeakState(false);

    window.speechSynthesis.speak(speechUtterance);
  }
}

export function setSpeakState(speaking) {
  if (speaking) {
    dom.speakBtn.classList.add('active');
    dom.speakIcon.setAttribute('data-lucide', 'square');
    dom.speakText.innerText = 'Stop';
  } else {
    dom.speakBtn.classList.remove('active');
    dom.speakIcon.setAttribute('data-lucide', 'volume-2');
    dom.speakText.innerText = 'Speak';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}
