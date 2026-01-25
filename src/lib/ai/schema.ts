/**
 * AI Response Schema and Validation
 * Based on M0 CLI design - enforces product constraints
 */

import { ConsultStep, ConsultOption, ConsultStepResponse } from "@/types/habit";

// Forbidden terms that must never appear in AI output
export const FORBIDDEN_TERMS = ["streak", "failure", "discipline", "lazy", "shame"];

// Time budget constraints
export const TIME_BUDGETS = {
  action: 2, // minutes
  prime: 30, // seconds
  recovery: 30, // seconds
};

/**
 * Validate a single option
 * Returns { errors, warnings } - errors block, warnings don't
 */
export function validateOption(option: ConsultOption): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title ≤6 words (warning only)
  const wordCount = option.title.trim().split(/\s+/).length;
  if (wordCount > 8) {
    errors.push(`Title exceeds 8 words: "${option.title}" (${wordCount} words)`);
  } else if (wordCount > 6) {
    warnings.push(`Title exceeds 6 words: ${wordCount} words`);
  }

  // Description - be lenient (200 chars hard limit, 120 is warning)
  if (option.description.length > 200) {
    errors.push(`Description exceeds 200 chars: ${option.description.length} chars`);
  } else if (option.description.length > 120) {
    warnings.push(`Description exceeds 120 chars: ${option.description.length} chars`);
  }

  // Why - be lenient (300 chars hard limit, 200 is warning)
  if (option.why.length > 300) {
    errors.push(`Why exceeds 300 chars: ${option.why.length} chars`);
  } else if (option.why.length > 200) {
    warnings.push(`Why exceeds 200 chars: ${option.why.length} chars`);
  }

  // Check for forbidden terms (always error)
  const allText = `${option.title} ${option.description} ${option.why}`.toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    if (allText.includes(term)) {
      errors.push(`Forbidden term found: "${term}"`);
    }
  }

  return { errors, warnings };
}

/**
 * Validate full step response
 */
export function validateStepResponse(
  response: ConsultStepResponse,
  expectedStep: ConsultStep
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step type must match
  if (response.step !== expectedStep) {
    errors.push(`Step mismatch: expected "${expectedStep}", got "${response.step}"`);
  }

  // Must have 2-3 options
  if (response.options.length < 2 || response.options.length > 3) {
    errors.push(`Invalid option count: ${response.options.length} (must be 2-3)`);
  }

  // Validate each option
  for (const option of response.options) {
    const optionValidation = validateOption(option);
    errors.push(...optionValidation.errors);
    warnings.push(...optionValidation.warnings);
  }

  // recommended_id must exist in options
  const optionIds = response.options.map((o) => o.id);
  if (!optionIds.includes(response.recommended_id)) {
    errors.push(`recommended_id "${response.recommended_id}" not found in options`);
  }

  // Check question for forbidden terms
  const questionLower = response.question.toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    if (questionLower.includes(term)) {
      errors.push(`Forbidden term in question: "${term}"`);
    }
  }

  // Check for generic language (warning only)
  const genericPhrases = ["just do it", "try your best", "be consistent"];
  for (const option of response.options) {
    const optionText = `${option.title} ${option.description}`.toLowerCase();
    for (const phrase of genericPhrases) {
      if (optionText.includes(phrase)) {
        warnings.push(`Generic language detected: "${phrase}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if time budget is mentioned for time-constrained steps
 */
export function checkTimeBudget(step: ConsultStep, options: ConsultOption[]): string[] {
  const warnings: string[] = [];

  const budgets: Record<string, { limit: number; unit: string }> = {
    action: { limit: 2, unit: "minute" },
    prime: { limit: 30, unit: "second" },
    recovery: { limit: 30, unit: "second" },
  };

  const budget = budgets[step];
  if (!budget) return warnings;

  for (const option of options) {
    const text = `${option.title} ${option.description}`.toLowerCase();
    // Check if time reference exists
    const hasTimeRef =
      text.includes("minute") ||
      text.includes("second") ||
      text.includes("min") ||
      text.includes("sec") ||
      /\d+\s*(m|s|min|sec)/.test(text);

    if (!hasTimeRef) {
      warnings.push(
        `Option "${option.id}" for step "${step}" should mention time budget (≤${budget.limit} ${budget.unit}s)`
      );
    }
  }

  return warnings;
}

/**
 * JSON schema for OpenAI structured output mode
 * Note: additionalProperties: false is required at every object level
 */
export const STEP_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    step: {
      type: "string",
      enum: [
        "intent",
        "orientation",
        "success_week",
        "anchor",
        "context",
        "action",
        "prime",
        "recovery",
        "snapshot",
        "success_map",
        "habit_select",
        "system_design",
        "contract",
      ],
    },
    question: { type: "string" },
    options: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          why: { type: "string" },
        },
        required: ["id", "title", "description", "why"],
        additionalProperties: false,
      },
    },
    recommended_id: { type: "string" },
    needs_free_text: { type: "boolean" },
    free_text_prompt: { type: ["string", "null"] },
  },
  required: ["step", "question", "options", "recommended_id", "needs_free_text", "free_text_prompt"],
  additionalProperties: false,
};
