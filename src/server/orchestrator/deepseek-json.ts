import "server-only";

import type { z } from "zod";

import { env } from "@/env";

/**
 * One DeepSeek JSON-mode call, validated against a schema.
 *
 * Returns null instead of throwing when the key is missing, the call fails, or
 * the model returns something that doesn't fit the schema — every caller has a
 * non-AI fallback, so a bad response degrades to that rather than to an error.
 */
export async function chatJson<T>(args: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  temperature?: number;
}): Promise<T | null> {
  const key = env.DEEPSEEK_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(
      `${env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
          temperature: args.temperature ?? 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: args.system },
            { role: "user", content: args.user },
          ],
        }),
      },
    );

    if (!res.ok) {
      // Status only — never log the key or the response body, which echoes input.
      console.error("DeepSeek request failed", res.status);
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = args.schema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error(
      "DeepSeek call errored",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}
