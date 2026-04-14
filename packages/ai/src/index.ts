// ─────────────────────────────────────────────
// packages/ai — Provider abstraction, prompt engine, AI orchestration
// ─────────────────────────────────────────────

export { AIProvider } from './provider';
export { PromptEngine } from './prompts';
export { MessageGenerator } from './message-generator';
export { PROMPT_TEMPLATES, type PromptTemplateKey } from './templates';
export type { GenerateOptions, GenerateResult, ProviderConfig } from './types';
