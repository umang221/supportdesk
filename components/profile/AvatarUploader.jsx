"use client";

import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { AVATAR_ACCEPT, MAX_AVATAR_MB } from "@/lib/constants/attachments";

/**
 * Avatar preview + upload control, shared by the staff and customer profile
 * pages. `uploadFn` is lib/api/users.js#uploadOwnAvatar or
 * lib/api/portal.js#uploadOwnCustomerAvatar — kept as a prop so this
 * component doesn't need to know which side (staff/customer) it's on.
 * `onUploaded` receives the updated record (whichever shape uploadFn's
 * response carries) so the parent can refresh its local `name`/`src` state.
 */
export function AvatarUploader({ name, src, uploadFn, onUploaded }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const result = await uploadFn(file);
      onUploaded(result);
    } catch (err) {
      setError(err.fieldErrors?.file ?? err.message ?? "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={src} size="lg" />
      <div className="flex flex-col gap-1">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          onChange={handleFileChange}
          className="sr-only"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-fit rounded-md border border-border-subtle bg-surface-card px-space-sm py-space-xs text-label-sm font-medium text-text-primary hover:border-border-strong hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Change photo"}
        </button>
        <p className="text-label-sm text-text-tertiary">PNG, JPEG, GIF, or WEBP, up to {MAX_AVATAR_MB}MB.</p>
        {error ? (
          <p role="alert" className="text-label-sm text-sla-critical-text">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
