import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { SendIcon, PaperclipIcon, NoteIcon } from "@/components/ui/icons";

/**
 * Reply / internal-note composer. Submitting appends the message to
 * AgentWorkspace's in-memory draft state (see `onSubmit`) — it is not
 * persisted anywhere and resets on reload, since there's no backend yet.
 * The attachment control is presentational only for the same reason.
 */
export function TicketComposer({ onSubmit }) {
  const [mode, setMode] = useState("reply");
  const [body, setBody] = useState("");
  const isNote = mode === "note";

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit({ body: trimmed, isInternal: isNote });
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-border-subtle p-space-lg">
      <div role="tablist" aria-label="Composer mode" className="mb-2 flex gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={!isNote}
          onClick={() => setMode("reply")}
          className={cn(
            "rounded-md px-space-sm py-space-xs text-label-sm font-medium transition-colors",
            !isNote ? "bg-accent-subtle text-primary" : "text-text-secondary hover:bg-surface-hover"
          )}
        >
          Reply to customer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isNote}
          onClick={() => setMode("note")}
          className={cn(
            "flex items-center gap-1 rounded-md px-space-sm py-space-xs text-label-sm font-medium transition-colors",
            isNote
              ? "bg-sla-approaching-bg text-sla-approaching-text"
              : "text-text-secondary hover:bg-surface-hover"
          )}
        >
          <NoteIcon className="h-3.5 w-3.5" />
          Internal note
        </button>
      </div>

      <label className="sr-only" htmlFor="reply-composer">
        {isNote ? "Write an internal note" : "Write a reply"}
      </label>
      <textarea
        id="reply-composer"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={
          isNote
            ? "Add a note for your team — the customer won't see this..."
            : "Write a reply to the customer..."
        }
        className={cn(
          "w-full resize-none rounded-lg border p-space-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2",
          isNote
            ? "border-sla-approaching-border bg-sla-approaching-bg focus:ring-sla-approaching-border"
            : "border-border-subtle bg-canvas-bg focus:border-primary focus:bg-surface-card focus:ring-accent-subtle"
        )}
      />

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          disabled
          aria-label="Attach a file"
          title="Attachments aren't available yet"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary disabled:cursor-not-allowed"
        >
          <PaperclipIcon className="h-4 w-4" />
        </button>

        <Button type="submit" size="compact" disabled={!body.trim()}>
          <SendIcon className="h-4 w-4" />
          {isNote ? "Add note" : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
