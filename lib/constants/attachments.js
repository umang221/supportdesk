/**
 * Client-side mirror of server/attachments/attachmentService.js's and
 * server/validators/messageValidators.js's limits — used only for the file
 * picker's `accept` attribute and pre-upload hints. The server re-validates
 * every one of these independently; this file exists purely for UX (letting
 * a user avoid an obviously-doomed selection), never as the actual guard.
 */
export const ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain";
export const MAX_ATTACHMENT_MB = 10;
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

// Mirrors server/attachments/avatarService.js's limits — images only, and a
// smaller cap than a ticket attachment, since this is a profile picture.
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
export const MAX_AVATAR_MB = 2;
