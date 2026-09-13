import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SendIcon, PaperclipIcon } from "@/components/ui/icons";

/**
 * Customer-facing reply box — a single mode (no internal-note tab, that's an
 * agent-only concept). Submitting appends to the page's local message state
 * (see PortalTicketDetail); nothing is persisted, since there's no backend.
 */
export function PortalReplyComposer({ onSubmit }) {
  const [body, setBody] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-subtle p-lg">
      <label className="sr-only" htmlFor="portal-reply">
        Write a reply
      </label>
      <textarea
        id="portal-reply"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a reply..."
        className="w-full resize-none rounded-lg border border-border-subtle bg-canvas-bg p-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
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
          Send reply
        </Button>
      </div>
    </form>
  );
}
