import { AIProvider } from './provider';
import { PromptEngine, type DBPromptOverride } from './prompts';
import type { PromptTemplateKey } from './templates';
import type { GenerateResult } from './types';

// ─────────────────────────────────────────────
// MessageGenerator — high-level service for generating AI messages
// Used by workflow engine and manual reply suggestion
// ─────────────────────────────────────────────

export interface GenerateMessageInput {
  templateKey: PromptTemplateKey;
  variables: Record<string, string>;
  promptOverride?: DBPromptOverride;
  model?: string;
}

export interface MessageGeneratorConfig {
  provider: AIProvider;
  engine?: PromptEngine;
}

export class MessageGenerator {
  private provider: AIProvider;
  private engine: PromptEngine;

  constructor(config: MessageGeneratorConfig) {
    this.provider = config.provider;
    this.engine = config.engine ?? new PromptEngine();
  }

  async generate(input: GenerateMessageInput): Promise<GenerateResult> {
    const missing = this.engine.validateVariables(input.templateKey, input.variables);
    if (missing.length > 0) {
      throw new Error(`Missing template variables: ${missing.join(', ')}`);
    }

    const compiled = this.engine.compile(
      input.templateKey,
      input.variables,
      input.promptOverride,
    );

    const result = await this.provider.generate({
      systemPrompt: compiled.systemPrompt,
      messages: [{ role: 'user', content: compiled.userMessage }],
      maxTokens: compiled.maxTokens,
      temperature: compiled.temperature,
      model: input.model,
    });

    return result;
  }

  /**
   * Quick generate for an AI reply suggestion shown to operators.
   */
  async suggestReply(params: {
    businessName: string;
    operatorName: string;
    leadName: string;
    conversationHistory: string;
    latestMessage: string;
  }): Promise<GenerateResult> {
    return this.generate({
      templateKey: 'ai_reply_suggestion',
      variables: params,
    });
  }

  /**
   * Generate first response to a new lead.
   */
  async firstResponse(params: {
    businessName: string;
    businessType: string;
    leadName: string;
    source: string;
    inquiry: string;
    promptOverride?: DBPromptOverride;
  }): Promise<GenerateResult> {
    const { promptOverride, ...variables } = params;
    return this.generate({
      templateKey: 'first_response',
      variables,
      promptOverride,
    });
  }

  /**
   * Generate missed call text-back.
   */
  async missedCallFollowup(params: {
    businessName: string;
    leadName: string;
    phone: string;
    promptOverride?: DBPromptOverride;
  }): Promise<GenerateResult> {
    const { promptOverride, ...variables } = params;
    return this.generate({
      templateKey: 'missed_call_followup',
      variables,
      promptOverride,
    });
  }
}
