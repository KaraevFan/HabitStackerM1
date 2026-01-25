/**
 * AI Client for HabitStacker
 * Wraps OpenAI API with structured output, retry logic, and validation
 */

import { ConsultStepResponse, ConsultStep } from "@/types/habit";
import { validateStepResponse, STEP_RESPONSE_JSON_SCHEMA } from "./schema";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface AIClientConfig {
  apiKey: string;
  model?: string;
}

interface GenerateOptions {
  prompt: string;
  expectedStep: ConsultStep;
  temperature?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AI Client class with retry logic and validation
 */
export class AIClient {
  private apiKey: string;
  private model: string;

  constructor(config: AIClientConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4o-mini";
  }

  /**
   * Generate a structured response for a consult step
   */
  async generateStepResponse(options: GenerateOptions): Promise<{
    response: ConsultStepResponse;
    warnings: string[];
  }> {
    const { prompt, expectedStep, temperature = 0.7 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.callOpenAI(prompt, temperature);

        // Validate response
        const validation = validateStepResponse(response, expectedStep);

        if (!validation.valid) {
          console.warn(`Validation failed (attempt ${attempt}):`, validation.errors);
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt);
            continue;
          }
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }

        return {
          response,
          warnings: validation.warnings,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`AI call failed (attempt ${attempt}):`, lastError.message);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError || new Error("AI generation failed after retries");
  }

  /**
   * Call OpenAI API with structured output
   * Note: Structured output mode doesn't support custom temperature
   */
  private async callOpenAI(
    prompt: string,
    _temperature: number
  ): Promise<ConsultStepResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        // Note: temperature not supported with structured output mode
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "step_response",
            strict: true,
            schema: STEP_RESPONSE_JSON_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content) as ConsultStepResponse;
  }
}

/**
 * Create AI client from environment
 */
export function createAIClient(): AIClient {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new AIClient({
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
}
