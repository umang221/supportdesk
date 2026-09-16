import { describe, it, expect, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import User from "@/server/models/User";
import Message from "@/server/models/Message";
import { PRIORITIES } from "@/lib/constants/priorities";
import { createTicket } from "@/server/services/ticketService";
import { createMessage } from "@/server/services/messageService";
import { validateCreateMessageInput } from "@/server/validators/messageValidators";
import {
  assertValidAttachmentFile,
  isAttachmentInTicketScope,
  assertUploadsConfigured,
} from "@/server/attachments/attachmentService";
import { createTestTeam, createTestCustomer, createTestUser } from "../helpers/factories";

const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];
const createdUserIds = [];

afterAll(async () => {
  await Message.deleteMany({ ticket: { $in: createdTicketIds } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

function fakeFile({ size = 1024, type = "image/png", name = "screenshot.png" } = {}) {
  return {
    size,
    type,
    name,
    arrayBuffer: async () => new ArrayBuffer(size),
  };
}

describe("assertValidAttachmentFile", () => {
  it("accepts a well-formed file within the allowlist and size limit", () => {
    expect(() => assertValidAttachmentFile(fakeFile())).not.toThrow();
  });

  it("rejects a missing file", () => {
    expect(() => assertValidAttachmentFile(null)).toThrow(/A file is required|No file provided/);
  });

  it("rejects an unsupported MIME type", () => {
    expect(() => assertValidAttachmentFile(fakeFile({ type: "application/x-msdownload" }))).toThrow(/Unsupported file type/);
  });

  it("rejects a file over the size limit", () => {
    expect(() => assertValidAttachmentFile(fakeFile({ size: 11 * 1024 * 1024 }))).toThrow(/exceeds/);
  });
});

describe("isAttachmentInTicketScope", () => {
  it("accepts a publicId under the ticket's own folder", () => {
    expect(isAttachmentInTicketScope("supportdesk/tickets/abc123/file_a1b2", "abc123")).toBe(true);
  });

  it("rejects a publicId belonging to a different ticket", () => {
    expect(isAttachmentInTicketScope("supportdesk/tickets/other-ticket/file_a1b2", "abc123")).toBe(false);
  });

  it("rejects a non-string publicId", () => {
    expect(isAttachmentInTicketScope(undefined, "abc123")).toBe(false);
  });
});

describe("validateCreateMessageInput — attachment references", () => {
  it("rejects an attachment publicId scoped to a different ticket", () => {
    expect(() =>
      validateCreateMessageInput(
        {
          body: "See attached",
          attachments: [
            {
              publicId: "supportdesk/tickets/other-ticket/file_a1b2",
              resourceType: "image",
              mimeType: "image/png",
              filename: "a.png",
              size: 100,
            },
          ],
        },
        "this-ticket"
      )
    ).toThrow(/Invalid message input/);
  });

  it("rejects more than the configured max attachments per message", () => {
    const attachments = Array.from({ length: 6 }, (_, i) => ({
      publicId: `supportdesk/tickets/t1/file_${i}`,
      resourceType: "image",
      mimeType: "image/png",
      filename: `f${i}.png`,
      size: 100,
    }));
    try {
      validateCreateMessageInput({ body: "many files", attachments }, "t1");
      expect.unreachable("expected validateCreateMessageInput to throw");
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.fieldErrors?.attachments).toMatch(/at most 5 attachments/);
    }
  });

  it("accepts a well-formed, correctly-scoped attachment reference", () => {
    const input = validateCreateMessageInput(
      {
        body: "See attached",
        attachments: [
          {
            publicId: "supportdesk/tickets/t1/file_a1b2",
            resourceType: "image",
            mimeType: "image/png",
            filename: "a.png",
            size: 100,
          },
        ],
      },
      "t1"
    );
    expect(input.attachments).toHaveLength(1);
    expect(input.attachments[0].publicId).toBe("supportdesk/tickets/t1/file_a1b2");
  });
});

describe("assertUploadsConfigured", () => {
  it("throws a 503 when Cloudinary env vars are absent (dev-safe default)", () => {
    // This dev/test environment intentionally has no CLOUDINARY_* vars set
    // (see .env.example) — confirms uploads fail closed with a clear error
    // rather than throwing an obscure SDK error deeper in the stack.
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      return; // Skip in an environment that does have real credentials configured.
    }
    expect(() => assertUploadsConfigured()).toThrow(/not configured/);
  });
});

describe("createMessage with attachments", () => {
  it("fails closed (503) instead of writing a message when uploads aren't configured", async () => {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      return; // Skip in an environment that does have real credentials configured.
    }

    const team = await createTestTeam();
    createdTeamIds.push(team._id);
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    const ticket = await createTicket({
      subject: "Attachment gating test",
      customer: customer._id.toString(),
      team: team._id.toString(),
      priority: PRIORITIES.LOW,
      channel: "email",
    });
    createdTicketIds.push(ticket._id);

    await expect(
      createMessage({
        ticketId: ticket._id.toString(),
        authorId: customer._id,
        authorModel: "Customer",
        body: "See attached",
        attachments: [
          {
            publicId: `supportdesk/tickets/${ticket._id.toString()}/file_a1b2`,
            resourceType: "image",
            mimeType: "image/png",
            filename: "a.png",
            size: 100,
          },
        ],
      })
    ).rejects.toMatchObject({ status: 503 });

    const messages = await Message.find({ ticket: ticket._id });
    expect(messages).toHaveLength(0);
  });
});
