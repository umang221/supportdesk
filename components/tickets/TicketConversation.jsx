import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { PaperclipIcon } from "@/components/ui/icons";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { formatDateTime } from "@/lib/utils/format-datetime";
import { formatFileSize } from "@/lib/utils/format-file-size";

/**
 * One message's attachments — an image renders as a clickable thumbnail
 * (opens the full-size signed URL in a new tab), anything else (PDF, plain
 * text) as a filename/size chip with a download link. `url` is always a
 * fresh, short-lived signed URL from the server (see
 * messageService.presentMessage) — never persisted, never guessable.
 */
function MessageAttachments({ attachments }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.publicId}>
          {attachment.resourceType === "image" ? (
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
              {/* next/image isn't a fit here: this URL is a signed, ~5-minute-lived
                  Cloudinary link (see attachmentService.getSignedAttachmentUrl),
                  regenerated fresh on every render — not a stable asset worth its
                  remote-pattern config or optimizer cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="h-20 w-20 rounded-md border border-border-subtle object-cover"
              />
            </a>
          ) : (
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-card px-2 py-1 text-label-sm text-text-primary hover:bg-surface-hover"
            >
              <PaperclipIcon className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="max-w-40 truncate">{attachment.filename}</span>
              <span className="text-text-tertiary">{formatFileSize(attachment.size)}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Message thread for the selected ticket, oldest first. Customer replies,
 * agent replies, and internal notes (`message.isInternal`) are styled
 * distinctly so it's never ambiguous what the customer will actually see.
 * `message.authorName` overrides the agentsById/customer lookup for
 * locally-composed drafts (see AgentWorkspace) that aren't in the mock data.
 */
export function TicketConversation({ messages, customer, agentsById, now }) {
  if (messages.length === 0) {
    return (
      <p className="p-space-lg text-body-sm text-text-tertiary">
        No messages yet on this ticket.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4 p-space-lg">
      {messages.map((message) => {
        const isAgent = message.authorType === "agent";
        const isInternal = Boolean(message.isInternal);
        const authorName = message.authorName ?? (isAgent ? agentsById.get(message.authorId)?.name : customer?.name);

        return (
          <li key={message.id} className="flex gap-3">
            <Avatar name={authorName} size="sm" className="mt-0.5 shrink-0" />
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border p-space-md",
                isInternal
                  ? "border-sla-approaching-border bg-sla-approaching-bg"
                  : isAgent
                    ? "border-accent-subtle bg-accent-subtle"
                    : "border-border-subtle bg-surface-card"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-label-sm font-medium text-text-primary">
                  {authorName ?? "Unknown"}
                  {isInternal ? (
                    <span className="ml-1.5 rounded bg-sla-approaching-text/10 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-sla-approaching-text">
                      Internal note
                    </span>
                  ) : isAgent ? (
                    <span className="ml-1.5 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Agent
                    </span>
                  ) : null}
                </span>
                <span
                  className="shrink-0 text-label-sm text-text-tertiary"
                  title={formatDateTime(message.createdAt)}
                >
                  {formatRelativeTime(message.createdAt, now)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-body-sm text-text-primary">{message.body}</p>
              <MessageAttachments attachments={message.attachments} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
