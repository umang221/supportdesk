import { generateText, generateJson, AiUnavailableError } from "@/server/ai/aiProvider";
import { PRIORITIES } from "@/lib/constants/priorities";
import { HttpError } from "@/server/utils/http-error";

const MAX_MESSAGES_IN_PROMPT = 20;
const MAX_MESSAGE_CHARS = 2000;

/**
 * Every export here wraps AiUnavailableError as HttpError(503) so the
 * calling route can return a clean, expected error response (missing key,
 * provider error, timeout) instead of a 500 — these are on-demand,
 * human-triggered actions (never run automatically), so a clear "try again
 * later" is the right failure mode.
 */
function toHttpError(error) {
  if (error instanceof AiUnavailableError) {
    return new HttpError(503, error.message, { code: "ai_unavailable" });
  }
  return error;
}

function formatConversation(messages) {
  return messages
    .filter((message) => message.type !== "internal_note")
    .slice(-MAX_MESSAGES_IN_PROMPT)
    .map((message) => {
      const speaker = message.type === "customer_reply" ? "Customer" : "Agent";
      const body = (message.body ?? "").slice(0, MAX_MESSAGE_CHARS);
      return `${speaker}: ${body}`;
    })
    .join("\n");
}

/** One-paragraph plain-text summary of a ticket's conversation so far. Purely advisory — never written back to the ticket automatically. */
export async function summarizeTicket(ticket, messages) {
  const conversation = formatConversation(messages);
  const prompt = `You are assisting a customer support agent. Summarize the following support ticket in 2-4 concise sentences, focused on the customer's issue and the current state of the conversation. Do not invent details not present below.

Subject: ${ticket.subject}
Priority: ${ticket.priority}
Status: ${ticket.status}

Conversation:
${conversation || "(no messages yet)"}

Summary:`;

  try {
    const text = await generateText(prompt);
    return { summary: text.trim() };
  } catch (error) {
    throw toHttpError(error);
  }
}

/** Suggested category label + priority for a ticket, with a short rationale. The agent decides whether to act on it — priority is never changed automatically. */
export async function suggestCategoryAndPriority(ticket, messages) {
  const conversation = formatConversation(messages);
  const prompt = `You are assisting a customer support agent triaging a ticket. Based on the subject and conversation below, suggest a short category label (2-4 words, e.g. "Billing Dispute", "API Integration", "Account Access") and a priority level.

Valid priority values: ${Object.values(PRIORITIES).join(", ")}.

Subject: ${ticket.subject}
Current priority: ${ticket.priority}

Conversation:
${conversation || "(no messages yet)"}

Respond with ONLY a JSON object in this exact shape, no other text:
{"category": "string", "priority": "one of the valid priority values", "rationale": "one short sentence explaining why"}`;

  try {
    const result = await generateJson(prompt);
    const priority = Object.values(PRIORITIES).includes(result?.priority) ? result.priority : ticket.priority;
    return {
      category: typeof result?.category === "string" ? result.category.slice(0, 60) : "Uncategorized",
      priority,
      rationale: typeof result?.rationale === "string" ? result.rationale.slice(0, 300) : "",
    };
  } catch (error) {
    throw toHttpError(error);
  }
}

/** Drafts a suggested customer-facing reply. Returned as plain text for the agent to review, edit, and send themselves — this never posts a message on its own. */
export async function suggestReply(ticket, messages) {
  const conversation = formatConversation(messages);
  const prompt = `You are assisting a customer support agent. Draft a polite, professional reply to the customer for the ticket below. Address their most recent message directly. Keep it concise (3-6 sentences). Do not include a greeting salutation with a placeholder name unless one is evident from the conversation. Output only the reply text, no preamble or explanation.

Subject: ${ticket.subject}

Conversation:
${conversation || "(no messages yet)"}

Reply:`;

  try {
    const text = await generateText(prompt);
    return { reply: text.trim() };
  } catch (error) {
    throw toHttpError(error);
  }
}

/** Interprets a pre-computed analytics summary (server/services/analyticsService.js) into a short narrative + notable callouts. Charts themselves never depend on this — see app/api/analytics/route.js. */
export async function generateAnalyticsInsights(analyticsSummary) {
  const prompt = `You are a support operations analyst. Given the JSON analytics summary below, write a brief (4-6 sentence) narrative for a support team lead: call out what's going well, what's concerning, and one concrete suggestion. Be specific using the numbers given. Do not restate the raw JSON.

Analytics summary:
${JSON.stringify(analyticsSummary)}

Narrative:`;

  try {
    const text = await generateText(prompt);
    return { insights: text.trim() };
  } catch (error) {
    throw toHttpError(error);
  }
}
