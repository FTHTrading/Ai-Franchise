import OpenAI from 'openai';
import type { GenerateOptions, GenerateResult, ProviderConfig } from './types';

// ─────────────────────────────────────────────
// AIProvider — wraps OpenAI with retries, logging, and future multi-provider support
// ─────────────────────────────────────────────

const ESCALATION_PHRASES = [
  'i want to speak to a human',
  'connect me to a person',
  'talk to a real person',
  'i want to talk to someone',
  'this is urgent',
  'emergency',
];

export class AIProvider {
  private client: OpenAI;
  private config: Required<ProviderConfig>;

  constructor(config: ProviderConfig) {
    this.config = {
      openaiApiKey: config.openaiApiKey,
      defaultModel: config.defaultModel ?? 'gpt-4o-mini',
      maxRetries: config.maxRetries ?? 2,
      timeout: config.timeout ?? 30_000,
    };

    this.client = new OpenAI({
      apiKey: this.config.openaiApiKey,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
    });
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model ?? this.config.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const msg of options.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.7,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('OpenAI returned empty response');
    }

    const text = choice.message.content.trim();
    const escalate = this.shouldEscalate(text);

    return {
      text,
      provider: 'openai',
      model,
      tokensUsed: response.usage?.total_tokens,
      confidence: escalate ? 0.3 : 0.9,
      escalate,
    };
  }

  // ─── Safety checks ──────────────────────────

  private shouldEscalate(text: string): boolean {
    const lower = text.toLowerCase();
    return ESCALATION_PHRASES.some((phrase) => lower.includes(phrase));
  }

  // ─── Simple one-shot convenience ────────────

  async complete(systemPrompt: string, userMessage: string, options?: Partial<GenerateOptions>): Promise<string> {
    const result = await this.generate({
      ...options,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    return result.text;
  }
}
