"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { updateOwnProfile, changeOwnPassword, uploadOwnAvatar } from "@/lib/api/users";
import { AvatarUploader } from "./AvatarUploader";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * Staff self-service account page: edit name/title, upload an avatar, and
 * change password. Role/team/isActive are never editable here — those stay
 * admin-only (see app/admin/agents), and the API route this posts to
 * (PATCH /api/users/me) rejects them outright if ever sent.
 */
export function StaffProfile({ user: initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [title, setTitle] = useState(initialUser.title ?? "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess(false);
    if (!name.trim()) {
      setFieldErrors({ name: "Name is required." });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const { user: updated } = await updateOwnProfile({ name: name.trim(), title: title.trim() });
      setUser(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError(err.message || "Unable to update your profile.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAvatarUpload(file) {
    return uploadOwnAvatar(file);
  }

  function handleAvatarUploaded({ user: updated }) {
    setUser(updated);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-md text-text-primary">Profile</h1>

      <Card>
        <h2 className="mb-3 text-label-sm font-medium text-text-secondary">Photo</h2>
        <AvatarUploader name={user.name} src={user.avatarUrl} uploadFn={handleAvatarUpload} onUploaded={handleAvatarUploaded} />
      </Card>

      <Card>
        <h2 className="mb-3 text-label-sm font-medium text-text-secondary">Account details</h2>
        <form onSubmit={handleProfileSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-profile-name" className="text-label-sm font-medium text-text-secondary">
              Name
            </label>
            <input
              id="staff-profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              className="h-9 rounded-lg border border-border-subtle bg-canvas-bg px-space-sm text-body-sm text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
            />
            {fieldErrors.name ? (
              <p role="alert" className="text-label-sm text-sla-critical-text">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="staff-profile-title" className="text-label-sm font-medium text-text-secondary">
              Title <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              id="staff-profile-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Senior Support Engineer"
              className="h-9 rounded-lg border border-border-subtle bg-canvas-bg px-space-sm text-body-sm text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
            />
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-text-tertiary">Email</dt>
            <dd className="text-text-primary">{user.email}</dd>
            <dt className="text-text-tertiary">Role</dt>
            <dd className="capitalize text-text-primary">{user.role?.replace("_", " ")}</dd>
          </dl>
          <p className="text-label-sm text-text-tertiary">
            Email and role are managed by an admin — contact one if either needs to change.
          </p>

          {formError ? (
            <p role="alert" className="text-label-sm text-sla-critical-text">
              {formError}
            </p>
          ) : null}
          {success ? <p className="text-label-sm text-sla-good-text">Profile updated.</p> : null}

          <Button type="submit" disabled={submitting || !name.trim()} className="self-start">
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      <ChangePasswordForm onSubmit={changeOwnPassword} />
    </div>
  );
}
