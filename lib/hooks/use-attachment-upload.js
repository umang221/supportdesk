"use client";

import { useCallback, useState } from "react";

/**
 * Shared "pick file(s) -> upload immediately -> collect attachment metadata
 * for the next message" state, used by both TicketComposer (agent) and
 * PortalReplyComposer (customer) — the upload/track/remove logic is
 * identical between them, only the surrounding markup differs, so this is a
 * hook rather than a component. `uploadFn` is the caller's
 * lib/api/messages.js#uploadTicketAttachment or
 * lib/api/portal.js#uploadPortalTicketAttachment — kept as an argument
 * rather than imported here so this hook doesn't need to know which side
 * (agent/customer) it's running on.
 */
export function useAttachmentUpload(uploadFn) {
  const [files, setFiles] = useState([]);

  const addFiles = useCallback(
    (fileList, ticketId) => {
      const entries = Array.from(fileList).map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        status: "uploading",
      }));
      setFiles((prev) => [...prev, ...entries]);

      Array.from(fileList).forEach(async (file, index) => {
        const key = entries[index].key;
        try {
          const { attachment } = await uploadFn(ticketId, file);
          setFiles((prev) => prev.map((entry) => (entry.key === key ? { ...entry, status: "done", attachment } : entry)));
        } catch (error) {
          setFiles((prev) =>
            prev.map((entry) =>
              entry.key === key ? { ...entry, status: "error", error: error.message || "Upload failed." } : entry
            )
          );
        }
      });
    },
    [uploadFn]
  );

  const removeFile = useCallback((key) => {
    setFiles((prev) => prev.filter((entry) => entry.key !== key));
  }, []);

  const reset = useCallback(() => setFiles([]), []);

  const attachments = files.filter((entry) => entry.status === "done").map((entry) => entry.attachment);
  const isUploading = files.some((entry) => entry.status === "uploading");

  return { files, addFiles, removeFile, reset, attachments, isUploading };
}
