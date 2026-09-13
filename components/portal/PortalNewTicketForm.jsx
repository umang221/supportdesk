"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Badge, Select } from "@/components/ui";
import { PRIORITY_LIST } from "@/lib/constants/priorities";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

/**
 * UI-only "create ticket" flow: on submit it fabricates a reference number
 * and shows a confirmation, but doesn't add anything to the mock ticket list
 * or persist anywhere — there's no backend yet. Confirming in place (rather
 * than redirecting to a detail page for a ticket that doesn't really exist
 * in the data) keeps that limitation honest.
 */
export function PortalNewTicketForm() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitted, setSubmitted] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitted({
      id: `TCK-NEW-${Date.now().toString().slice(-4)}`,
      subject: subject.trim(),
      priority,
    });
  }

  function handleReset() {
    setSubject("");
    setDescription("");
    setPriority("medium");
    setSubmitted(null);
  }

  if (submitted) {
    const priorityMeta = findMeta(PRIORITY_LIST, submitted.priority);
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-subtle bg-surface-card p-2xl text-center">
        <p className="text-body-md font-medium text-text-primary">Ticket submitted</p>
        <p className="max-w-sm text-body-sm text-text-tertiary">
          We&rsquo;ve received your request and a member of our team will get back to you shortly.
        </p>
        <div className="flex items-center gap-2 rounded-md bg-canvas-bg px-md py-sm">
          <span className="font-mono text-label-sm text-text-tertiary">{submitted.id}</span>
          <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label}</Badge>
        </div>
        <p className="max-w-sm text-label-sm text-text-tertiary">&ldquo;{submitted.subject}&rdquo;</p>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={handleReset}>
            Submit another
          </Button>
          <Link href="/portal">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-md text-text-primary">New Ticket</h1>
        <p className="text-body-sm text-text-tertiary">Tell us what&rsquo;s going on and we&rsquo;ll take it from there.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-ticket-subject" className="text-label-sm font-medium text-text-secondary">
          Subject
        </label>
        <input
          id="new-ticket-subject"
          type="text"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Briefly describe the issue"
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-ticket-priority" className="text-label-sm font-medium text-text-secondary">
          Priority
        </label>
        <Select
          id="new-ticket-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="w-full sm:w-56"
        >
          {PRIORITY_LIST.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-ticket-description" className="text-label-sm font-medium text-text-secondary">
          Description
        </label>
        <textarea
          id="new-ticket-description"
          required
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Include any details that might help — what you expected, what happened instead, and when it started."
          className="resize-none rounded-lg border border-border-subtle bg-surface-card p-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!subject.trim() || !description.trim()}>
          Submit ticket
        </Button>
      </div>
    </form>
  );
}
