/**
 * api.js — Renderer
 * Sends AI text-generation requests.
 * In Electron → proxies through main process (IPC) so keys stay safe.
 * In Browser  → calls provider APIs directly from the renderer.
 */

import { state } from './state.js';

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * @param {string} question
 * @returns {Promise<string>} The AI-generated answer text.
 * @throws {Error} On any network or API error.
 */
export async function sendAiRequest(question) {
  const { provider, model, systemPrompt } = state.activeConfig;

  if (state.isElectron) {
    const res = await window.electron.sendAiRequest({ provider, model, systemPrompt, question });
    if (res.success) return res.answer;
    throw new Error(res.error || 'Unknown desktop response error.');
  }

  return sendBrowserRequest(provider, model, systemPrompt, question);
}

// ─── Browser direct calls ────────────────────────────────────────────────────

async function sendBrowserRequest(provider, model, systemPrompt, question) {
  const apiKey = localStorage.getItem(`api_key_${provider}`);
  if (!apiKey) {
    const label = { gemini: 'Gemini', openai: 'OpenAI', groq: 'Groq' }[provider] || provider;
    throw new Error(`API key for ${label} is missing. Click the Settings icon below to enter it.`);
  }

  if (provider === 'gemini')      return callGemini(model, systemPrompt, question, apiKey);
  if (provider === 'openai')      return callOpenAI(model, systemPrompt, question, apiKey);
  if (provider === 'groq')        return callGroq(model, systemPrompt, question, apiKey);
  throw new Error(`Unknown provider: ${provider}`);
}

async function callGemini(model, systemPrompt, question, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nQuestion: ${question}` }] }]
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Gemini HTTP ${res.status}`);
  if (json.candidates?.[0]?.content?.parts?.[0]?.text) return json.candidates[0].content.parts[0].text;
  throw new Error('Malformed Gemini response.');
}

async function callOpenAI(model, systemPrompt, question, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body:    JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: question }
      ]
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `OpenAI HTTP ${res.status}`);
  if (json.choices?.[0]?.message?.content) return json.choices[0].message.content;
  throw new Error('Malformed OpenAI response.');
}

async function callGroq(model, systemPrompt, question, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body:    JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: question }
      ]
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Groq HTTP ${res.status}`);
  if (json.choices?.[0]?.message?.content) return json.choices[0].message.content;
  throw new Error('Malformed Groq response.');
}
