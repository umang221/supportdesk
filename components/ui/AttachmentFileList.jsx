import { CloseIcon } from "./icons";
import { formatFileSize } from "@/lib/utils/format-file-size";

/**
 * Chip list for in-progress/uploaded/failed attachments, shared by
 * TicketComposer (agent) and PortalReplyComposer (customer) — see
 * lib/hooks/use-attachment-upload.js for the state this renders.
 */
export function AttachmentFileList({ files, onRemove }) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {files.map((file) => (
        <li
          key={file.key}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-canvas-bg px-2 py-1 text-label-sm"
        >
          <span className="max-w-40 truncate text-text-primary" title={file.name}>
            {file.name}
          </span>
          <span className="text-text-tertiary">{formatFileSize(file.size)}</span>
          {file.status === "uploading" ? (
            <span className="text-text-tertiary">Uploading&hellip;</span>
          ) : file.status === "error" ? (
            <span className="text-sla-critical-text">{file.error ?? "Failed"}</span>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(file.key)}
            aria-label={`Remove ${file.name}`}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
