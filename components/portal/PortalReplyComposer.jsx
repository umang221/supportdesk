import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AttachmentFileList } from "@/components/ui/AttachmentFileList";
import { SendIcon, PaperclipIcon } from "@/components/ui/icons";
import { uploadPortalTicketAttachment } from "@/lib/api/portal";
import { useAttachmentUpload } from "@/lib/hooks/use-attachment-upload";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS_PER_MESSAGE } from "@/lib/constants/attachments";

/**
 * Customer-facing reply box — a single mode (no internal-note tab, that's an
 * agent-only concept). Submitting posts a real message via PortalTicketDetail's
 * handleReply (see app/api/portal/tickets/[id]/messages). Attachments upload
 * immediately on selection, same flow as TicketComposer's (agent) — see
 * lib/hooks/use-attachment-upload.js.
 */
export function PortalReplyComposer({ ticketId, onSubmit }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputId = useId();
  const fileInputRef = useRef(null);
  const { files, addFiles, removeFile, reset: resetFiles, attachments, isUploading } = useAttachmentUpload(uploadPortalTicketAttachment);

  const canAddMoreFiles = files.length < MAX_ATTACHMENTS_PER_MESSAGE;

  function handleFileChange(event) {
    const selected = event.target.files;
    if (selected && selected.length > 0) {
      addFiles(selected, ticketId);
    }
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isUploading) return;
    setSubmitting(true);
    await onSubmit({ body: trimmed, attachments });
    setBody("");
    resetFiles();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-subtle p-space-lg">
      <label className="sr-only" htmlFor="portal-reply">
        Write a reply
      </label>
      <textarea
        id="portal-reply"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a reply..."
        className="w-full resize-none rounded-lg border border-border-subtle bg-canvas-bg p-space-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
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

        <Button type="submit" size="compact" disabled={!body.trim() || submitting || isUploading}>
          <SendIcon className="h-4 w-4" />
          {submitting ? "Sending..." : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
