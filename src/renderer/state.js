/**
 * state.js — Renderer
 * Single source of truth for all shared application state.
 * Import this object in any module; mutate it directly.
 */

export const state = {
  // Environment
  isElectron: typeof window !== 'undefined' && window.electron !== undefined,
  isMockMode:  false,

  // Active AI configuration
  activeConfig: {
    provider:     'gemini',
    model:        'gemini-3.5-flash',
    systemPrompt: 'You are an expert interviewer. Provide concise, constructive, and structured answers suitable for a live verbal interview scenario. Highlight key terms and write clean code examples if applicable.'
  },

  // Current session data
  currentResponseText: '',
  isRecording:         false
};

/** Available models per provider */
export const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-3.5-flash',  label: 'Gemini 3.5 Flash (Recommended)' },
    { value: 'gemini-1.5-flash',  label: 'Gemini 1.5 Flash (Legacy Stable)' },
    { value: 'gemini-2.5-pro',    label: 'Gemini 2.5 Pro (Advanced)' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Speed)' },
    { value: 'gpt-4o',      label: 'GPT-4o (Strong)' },
    { value: 'o3-mini',     label: 'o3-mini (Reasoning)' }
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B (Recommended)' },
    { value: 'deepseek-r1-distill-llama-70b',  label: 'DeepSeek R1 70B (Reasoner)' },
    { value: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B (Fast)' }
  ]
};
