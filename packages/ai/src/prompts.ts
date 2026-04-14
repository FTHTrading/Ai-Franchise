import { PROMPT_TEMPLATES, type PromptTemplateKey } from './templates';

// ─────────────────────────────────────────────
// PromptEngine — compiles prompt templates with variable substitution
// Supports DB-overridden prompts per organization/client
// ─────────────────────────────────────────────

export interface CompiledPrompt {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

export interface DBPromptOverride {
  systemPrompt?: string;
  userPromptTemplate?: string;
  maxTokens?: number;
  temperature?: number;
}

export class PromptEngine {
  /**
   * Compile a built-in template with variable substitution.
   * Optionally merge DB-stored overrides (per-client customization).
   */
  compile(
    key: PromptTemplateKey,
    variables: Record<string, string>,
    override?: DBPromptOverride,
  ): CompiledPrompt {
    const template = PROMPT_TEMPLATES[key];
    if (!template) {
      throw new Error(`Unknown prompt template key: ${key}`);
    }

    const systemPrompt = override?.systemPrompt
      ? this.interpolate(override.systemPrompt, variables)
      : this.interpolate(template.systemPrompt, variables);

    const userMessage = override?.userPromptTemplate
      ? this.interpolate(override.userPromptTemplate, variables)
      : this.interpolate(template.userPromptTemplate, variables);

    return {
      systemPrompt,
      userMessage,
      maxTokens: override?.maxTokens ?? template.maxTokens,
      temperature: override?.temperature ?? template.temperature,
    };
  }

  /**
   * Replace {{variable}} placeholders. Unknown variables become empty string.
   */
  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
  }

  /**
   * Return the list of required variables for a template.
   */
  getRequiredVariables(key: PromptTemplateKey): string[] {
    return PROMPT_TEMPLATES[key]?.variables ?? [];
  }

  /**
   * Validate that all required variables for a template are provided.
   */
  validateVariables(key: PromptTemplateKey, vars: Record<string, string>): string[] {
    const required = this.getRequiredVariables(key);
    return required.filter((v) => !vars[v]);
  }
}
