/**
 * Server-only Claude call helpers for the Enterprise Architecture agent.
 * Port of services/claude_service.py. Only ever imported from API route
 * handlers under src/app/api/enterprise-architecture/* — never from
 * client components.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in environment");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

function textOf(response: Anthropic.Message): string {
  const block = response.content[0];
  return block && block.type === "text" ? block.text : "";
}

/** Single-turn Claude call. Returns the text content string. */
export async function callClaude(systemPrompt: string, userMessage: string, maxTokens = 4096): Promise<string> {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    return textOf(response);
  } catch (e) {
    return JSON.stringify({ error: `Claude call failed: ${e instanceof Error ? e.message : String(e)}` });
  }
}

/** Multi-turn Claude call with message history. Returns text content string. */
export async function callClaudeWithHistory(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });
    return textOf(response);
  } catch (e) {
    return JSON.stringify({ error: `Claude call failed: ${e instanceof Error ? e.message : String(e)}` });
  }
}

/** Call Claude with an image using the vision API. Returns text content string. */
export async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mediaType: string,
  promptText = "",
): Promise<string> {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: promptText || "Extract all EA applications, tools and systems visible in this image. Return only JSON.",
            },
          ],
        },
      ],
    });
    return textOf(response);
  } catch (e) {
    return JSON.stringify({ error: `Claude vision call failed: ${e instanceof Error ? e.message : String(e)}` });
  }
}

/**
 * Lenient JSON parsing of a Claude text response: strips markdown code
 * fences, then falls back to regex-extracting the first {...} block.
 * Mirrors the `result_str.strip().lstrip("```json")...` pattern repeated
 * throughout the Python agents.
 */
export function parseJsonLenient<T = Record<string, unknown>>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    cleaned = lines.join("\n").trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // fall through
      }
    }
    return { raw_response: raw, parse_error: "Response was not valid JSON" } as unknown as T;
  }
}
