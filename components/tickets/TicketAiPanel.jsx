"use client";

import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { fetchTicketSummary, fetchTicketSuggestion, fetchSuggestedReply } from "@/lib/api/ai";

const IDLE = "idle";
const LOADING = "loading";
const ERROR = "error";
const DONE = "done";

/**
 * On-demand AI assistance for the selected ticket — every action here is a
 * button click, nothing runs automatically (see app/api/tickets/[id]/ai/*).
 * All output is untrusted model text the agent must review: a priority
 * suggestion only becomes real once the agent clicks "Apply" (which reuses
 * the existing onApplyPriority the header's priority control already calls
 * — see TicketDetail/AgentWorkspace's handlePriorityChange), and a
 * suggested reply only becomes real once the agent clicks "Use as reply"
 * and then actually sends it from the composer themselves.
 */
export function TicketAiPanel({ ticketId, currentPriority, onApplyPriority, onUseAsReply }) {
  const [summaryState, setSummaryState] = useState({ status: IDLE });
  const [suggestionState, setSuggestionState] = useState({ status: IDLE });
  const [replyState, setReplyState] = useState({ status: IDLE });

  async function handleSummarize() {
    setSummaryState({ status: LOADING });
    try {
      const result = await fetchTicketSummary(ticketId);
      setSummaryState({ status: DONE, summary: result.summary });
    } catch (error) {
      setSummaryState({ status: ERROR, error: error.message });
    }
  }

  async function handleSuggest() {
    setSuggestionState({ status: LOADING });
    try {
      const result = await fetchTicketSuggestion(ticketId);
      setSuggestionState({ status: DONE, ...result });
    } catch (error) {
      setSuggestionState({ status: ERROR, error: error.message });
    }
  }

  async function handleDraftReply() {
    setReplyState({ status: LOADING });
    try {
      const result = await fetchSuggestedReply(ticketId);
      setReplyState({ status: DONE, reply: result.reply });
    } catch (error) {
      setReplyState({ status: ERROR, error: error.message });
    }
  }

  const priorityMeta = suggestionState.priority
    ? PRIORITY_LIST.find((item) => item.value === suggestionState.priority)
    : null;

  return (
    <div className="space-y-3 border-b border-border-subtle p-space-lg">
      <h3 className="text-label-sm font-medium text-text-secondary">AI Assist</h3>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="compact" disabled={summaryState.status === LOADING} onClick={handleSummarize}>
          {summaryState.status === LOADING ? "Summarizing…" : "Summarize"}
        </Button>
        <Button variant="secondary" size="compact" disabled={suggestionState.status === LOADING} onClick={handleSuggest}>
          {suggestionState.status === LOADING ? "Analyzing…" : "Suggest category/priority"}
        </Button>
        <Button variant="secondary" size="compact" disabled={replyState.status === LOADING} onClick={handleDraftReply}>
          {replyState.status === LOADING ? "Drafting…" : "Draft reply"}
        </Button>
      </div>

      {summaryState.status === ERROR ? <p className="text-label-sm text-sla-critical-text">{summaryState.error}</p> : null}
      {summaryState.status === DONE ? (
        <p className="rounded-md bg-canvas-bg p-space-sm text-body-sm text-text-primary">{summaryState.summary}</p>
      ) : null}

      {suggestionState.status === ERROR ? <p className="text-label-sm text-sla-critical-text">{suggestionState.error}</p> : null}
      {suggestionState.status === DONE ? (
        <div className="flex flex-col gap-1.5 rounded-md bg-canvas-bg p-space-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{suggestionState.category}</Badge>
            {priorityMeta ? <Badge variant={priorityMeta.badgeVariant}>{priorityMeta.label}</Badge> : null}
            {suggestionState.priority && suggestionState.priority !== currentPriority ? (
              <Button size="compact" variant="secondary" onClick={() => onApplyPriority(suggestionState.priority)}>
                Apply priority
              </Button>
            ) : null}
          </div>
          {suggestionState.rationale ? <p className="text-label-sm text-text-tertiary">{suggestionState.rationale}</p> : null}
        </div>
      ) : null}

      {replyState.status === ERROR ? <p className="text-label-sm text-sla-critical-text">{replyState.error}</p> : null}
      {replyState.status === DONE ? (
        <div className="flex flex-col gap-2 rounded-md bg-canvas-bg p-space-sm">
          <p className="whitespace-pre-wrap text-body-sm text-text-primary">{replyState.reply}</p>
          <Button size="compact" onClick={() => onUseAsReply(replyState.reply)} className="self-start">
            Use as reply
          </Button>
        </div>
      ) : null}
    </div>
  );
}
