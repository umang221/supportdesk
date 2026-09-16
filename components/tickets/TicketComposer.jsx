import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { AttachmentFileList } from "@/components/ui/AttachmentFileList";
import { SendIcon, PaperclipIcon, NoteIcon } from "@/components/ui/icons";
import { uploadTicketAttachment } from "@/lib/api/messages";
import { useAttachmentUpload } from "@/lib/hooks/use-attachment-upload";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS_PER_MESSAGE } from "@/lib/constants/attachments";

/**
 * Reply / internal-note composer. Submitting calls AgentWorkspace's
 * handleAddMessage (see `onSubmit`), which posts to the real message API
 * and triggers the corresponding reply email. Attachments upload
 * immediately on selection (see useAttachmentUpload) — this composer only
 * sends the resulting metadata, never a raw file, on submit.
 *
 * `draftReply` optionally seeds the body from TicketAiPanel's "Use as
 * reply" action (see AgentWorkspace's aiDraftReply state). TicketDetail
 * renders this component with `key={draftReply?.token}`, so a new token
 * remounts it fresh with the suggested text pre-filled — a plain lazy
 * initial state, not an effect, since this is "reset the component to a
 * new starting value" rather than "synchronize with an external system".
 */
export function TicketComposer({ ticketId, onSubmit, draftReply }) {
  const [mode, setMode] = useState("reply");
  const [body, setBody] = useState(() => draftReply?.text ?? "");
  const isNote = mode === "note";
  const fileInputId = useId();
  const fileInputRef = useRef(null);
  const { files, addFiles, removeFile, reset: resetFiles, attachments, isUploading } = useAttachmentUpload(uploadTicketAttachment);

  const canAddMoreFiles = files.length < MAX_ATTACHMENTS_PER_MESSAGE;

  function handleFileChange(event) {
    const selected = event.target.files;
    if (selected && selected.length > 0) {
      addFiles(selected, ticketId);
    }
    event.target.value = "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isUploading) return;
    onSubmit({ body: trimmed, isInternal: isNote, attachments });
    setBody("");
    resetFiles();
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

      <AttachmentFileList files={files} onRemove={removeFile} />

      <div className="mt-2 flex items-center justify-between">
        <div>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            disabled={!canAddMoreFiles}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
            title={canAddMoreFiles ? "Attach a file" : `A message may have at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:text-text-tertiary disabled:hover:bg-transparent"
          >
            <PaperclipIcon className="h-4 w-4" />
          </button>
        </div>

        <Button type="submit" size="compact" disabled={!body.trim() || isUploading}>
          <SendIcon className="h-4 w-4" />
          {isNote ? "Add note" : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
