import type { AIProvider as AIProviderType, AIMessage, AIResponse } from '@aaos/types';

export interface ProviderConfig {
  openaiApiKey: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface GenerateOptions {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  provider: AIProviderType;
  model: string;
  tokensUsed?: number;
  confidence?: number;
  escalate?: boolean;
}
