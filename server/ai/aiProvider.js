/**
 * Server-side Gemini provider abstraction. `GEMINI_API_KEY` is read only
 * here (never sent to the client, never under NEXT_PUBLIC_*) and only at
 * call time, so a missing key is a clean, catchable condition rather than a
 * module-load crash — useful in development where AI features are simply
 * unavailable until a key is configured.
 *
 * Everything callers get back from generateJson()/generateText() is model
 * output: untrusted text that must be reviewed by a human before it affects
 * a ticket (see server/ai/aiService.js) — this module does no such
 * filtering itself, it only talks to the API safely.
 */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_TIMEOUT_MS = 15_000;

export class AiUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiUnavailableError("AI features are not configured (missing GEMINI_API_KEY).");
  }
  return apiKey;
}

/**
 * Calls Gemini's generateContent endpoint with a single text prompt.
 * Returns the plain-text response. Throws AiUnavailableError for a missing
 * key, a request timeout, or any non-2xx/malformed response — callers
 * (aiService) turn that into a clear, user-facing "AI unavailable" outcome
 * rather than a crash.
 */
export async function generateText(prompt) {
  const apiKey = requireApiKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new AiUnavailableError(`Gemini request failed (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) {
      throw new AiUnavailableError("Gemini returned an empty response.");
    }
    return text;
  } catch (error) {
    if (error instanceof AiUnavailableError) throw error;
    if (error?.name === "AbortError") {
      throw new AiUnavailableError("Gemini request timed out.");
    }
    throw new AiUnavailableError(`Gemini request failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

/** Same as generateText, but strips a ```json fenced block if present and parses the result. Throws AiUnavailableError if parsing fails. */
export async function generateJson(prompt) {
  const text = await generateText(prompt);
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1] : text;
  try {
    return JSON.parse(jsonText.trim());
  } catch {
    throw new AiUnavailableError("Gemini returned a response that could not be parsed as JSON.");
  }
}

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}
