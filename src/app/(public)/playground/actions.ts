"use server";

import { z } from "zod";

const playgroundSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(2048),
  model: z.string().default("claude-opus-4-6"),
});

export type PlaygroundInput = z.infer<typeof playgroundSchema>;

export interface PlaygroundResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    latencyMs: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export async function submitPlaygroundPrompt(input: PlaygroundInput): Promise<PlaygroundResponse> {
  const startTime = Date.now();
  try {
    const parsed = playgroundSchema.parse(input);

    const apiKey = process.env.CLAUDE_NETIVA_KEY;
    const baseUrl = process.env.CLAUDE_NETIVA_URL || "https://apiv3.netiva.com.tr";

    if (!apiKey) {
      return {
        success: false,
        error: "CLAUDE_NETIVA_KEY is not configured in environment variables.",
      };
    }

    const messages: { role: string; content: string }[] = [];
    if (parsed.systemPrompt) {
      messages.push({ role: "system", content: parsed.systemPrompt });
    }
    messages.push({ role: "user", content: parsed.prompt });

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: parsed.model,
        messages,
        temperature: parsed.temperature,
        max_tokens: parsed.maxTokens,
      }),
    });

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `API error with status ${response.status}`,
      };
    }

    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      success: true,
      content,
      metadata: {
        latencyMs,
        usage,
      },
    };
  } catch (error) {
    console.error("Playground Action Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
