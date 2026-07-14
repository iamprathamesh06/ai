/**
 * ai-handler.js — Main Process
 * Proxies all AI text-generation requests to external providers via Node HTTPS.
 * Runs in the main process so API keys never touch the renderer sandbox.
 */

'use strict';

const https = require('https');
const { getDecryptedKey } = require('./config-manager');

// ─── HTTPS helper ────────────────────────────────────────────────────────────

function httpsPost(url, headers, bodyData) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     443,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on('error', reject);
    req.write(bodyData);
    req.end();
  });
}

// ─── Provider handlers ───────────────────────────────────────────────────────

async function callGemini(model, systemPrompt, question, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nQuestion/Topic: ${question}` }]
    }]
  });

  const res = await httpsPost(url, {}, payload);
  const json = JSON.parse(res.data);

  if (res.statusCode === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
    return json.candidates[0].content.parts[0].text;
  }
  throw new Error(json.error?.message || `Gemini HTTP ${res.statusCode}`);
}

async function callOpenAI(model, systemPrompt, question, apiKey) {
  const payload = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: question }
    ]
  });

  const res = await httpsPost(
    'https://api.openai.com/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    payload
  );
  const json = JSON.parse(res.data);

  if (res.statusCode === 200 && json.choices?.[0]?.message?.content) {
    return json.choices[0].message.content;
  }
  throw new Error(json.error?.message || `OpenAI HTTP ${res.statusCode}`);
}

async function callGroq(model, systemPrompt, question, apiKey) {
  const payload = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: question }
    ]
  });

  const res = await httpsPost(
    'https://api.groq.com/openai/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    payload
  );
  const json = JSON.parse(res.data);

  if (res.statusCode === 200 && json.choices?.[0]?.message?.content) {
    return json.choices[0].message.content;
  }
  throw new Error(json.error?.message || `Groq HTTP ${res.statusCode}`);
}

// ─── Mock response ───────────────────────────────────────────────────────────

function mockResponse(provider, model, question) {
  return `### Mock Interview Feedback (Offline Mode)

You asked: *"${question}"*

1. **Direct Answer**: Provide a high-level summary.
2. **Technical Details**: Explain the core concepts.
3. **Example**:

\`\`\`javascript
function solveProblem(input) {
  return input.split('').reverse().join('');
}
console.log(solveProblem("interview")); // "weivretni"
\`\`\`

*Note: In production this would come from **${provider}** / \`${model}\`.*`;
}

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * @param {{ provider, model, systemPrompt, question }} payload
 * @param {boolean} isMockMode
 * @returns {{ success: boolean, answer?: string, error?: string }}
 */
async function handleAiRequest(payload, isMockMode) {
  const { provider, model, systemPrompt, question } = payload;

  if (isMockMode) {
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, answer: mockResponse(provider, model, question) };
  }

  const apiKey = getDecryptedKey(provider);
  if (!apiKey) {
    const label = { gemini: 'Gemini', openai: 'OpenAI', groq: 'Groq' }[provider] || provider;
    return { success: false, error: `API Key for ${label} is missing. Please configure it in Settings.` };
  }

  try {
    let answer;
    if (provider === 'gemini')      answer = await callGemini(model, systemPrompt, question, apiKey);
    else if (provider === 'openai') answer = await callOpenAI(model, systemPrompt, question, apiKey);
    else if (provider === 'groq')   answer = await callGroq(model, systemPrompt, question, apiKey);
    else throw new Error(`Unknown provider: ${provider}`);

    return { success: true, answer };
  } catch (err) {
    console.error('[ai-handler] Request failed:', err);
    return { success: false, error: `Network Error: ${err.message}` };
  }
}

module.exports = { handleAiRequest };
