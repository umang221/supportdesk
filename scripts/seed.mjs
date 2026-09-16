/**
 * Migrates the SupportDesk mock data (lib/mock-data) into MongoDB using the
 * Mongoose models from server/models. Safe to run repeatedly: every write is
 * an upsert keyed on a stable natural id (email, team name, ticket number,
 * or a legacyId carried over from the mock record's id), so re-running never
 * creates duplicates.
 *
 * Usage: npm run seed
 */
import fs from "fs";
import path from "path";
import { register } from "node:module";
import bcrypt from "bcryptjs";

register("./alias-loader.mjs", import.meta.url);

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2];
    }
  }
}
loadEnvLocal();

const { connectDB } = await import("../server/utils/db.js");
const { default: Team } = await import("../server/models/Team.js");
const { default: User } = await import("../server/models/User.js");
const { default: Customer } = await import("../server/models/Customer.js");
const { default: Ticket } = await import("../server/models/Ticket.js");
const { default: Message } = await import("../server/models/Message.js");
const { default: KnowledgeArticle } = await import("../server/models/KnowledgeArticle.js");
const { default: Notification } = await import("../server/models/Notification.js");

const { teams } = await import("../lib/mock-data/teams.js");
const { agents } = await import("../lib/mock-data/agents.js");
const { customers } = await import("../lib/mock-data/customers.js");
const { tickets } = await import("../lib/mock-data/tickets.js");
const { messages } = await import("../lib/mock-data/messages.js");
const { knowledgeArticles } = await import("../lib/mock-data/knowledge-articles.js");
const { notifications } = await import("../lib/mock-data/notifications.js");

// Placeholder credential for every seeded agent — no real auth exists yet
// (deferred to a later milestone). Hashed, never stored/logged in plaintext.
const SEED_PASSWORD = "ChangeMe123!";

async function upsert(Model, filter, data) {
  return Model.findOneAndUpdate(
    filter,
    { $set: data },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      timestamps: false,
    }
  );
}

async function seedTeams() {
  const idMap = new Map();
  for (const team of teams) {
    const doc = await upsert(
      Team,
      { name: team.name },
      { description: team.description }
    );
    idMap.set(team.id, doc._id);
  }
  return idMap;
}

// Permanent seeded demo admin account (architecture decision: admins are
// never self-registered or created via a first-run setup flow — this seed
// override is the only place an admin account is ever created). Everyone
// else's role still derives from their seed title.
const SEEDED_ADMIN_EMAIL = "hana.kobayashi@supportdesk.io";

function roleForSeededAgent(agent) {
  if (agent.email === SEEDED_ADMIN_EMAIL) return "admin";
  return agent.title === "Team Lead" ? "team_lead" : "agent";
}

async function seedUsers(teamIdMap) {
  const idMap = new Map();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const agent of agents) {
    const doc = await upsert(
      User,
      { email: agent.email },
      {
        name: agent.name,
        passwordHash,
        title: agent.title,
        role: roleForSeededAgent(agent),
        team: teamIdMap.get(agent.teamId) ?? null,
        isActive: true,
      }
    );
    idMap.set(agent.id, doc._id);
  }
  return idMap;
}

async function seedCustomers() {
  const idMap = new Map();
  // Same placeholder credential as agents (SEED_PASSWORD) — lets every
  // seeded customer sign into the portal for demo/testing without going
  // through registration.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const customer of customers) {
    const doc = await upsert(
      Customer,
      { email: customer.email },
      {
        name: customer.name,
        phone: customer.phone,
        company: customer.company,
        plan: customer.plan,
        passwordHash,
      }
    );
    idMap.set(customer.id, doc._id);
  }
  return idMap;
}

async function seedTickets(teamIdMap, userIdMap, customerIdMap) {
  const idMap = new Map();
  for (const ticket of tickets) {
    const createdAt = new Date(ticket.createdAt);
    const updatedAt = new Date(ticket.updatedAt);
    const doc = await upsert(
      Ticket,
      { ticketNumber: ticket.id },
      {
        subject: ticket.subject,
        customer: customerIdMap.get(ticket.customerId),
        team: teamIdMap.get(ticket.teamId),
        assignee: ticket.assigneeId ? userIdMap.get(ticket.assigneeId) : null,
        priority: ticket.priority,
        status: ticket.status,
        slaState: ticket.slaState,
        channel: ticket.channel,
        dueAt: ticket.dueAt ? new Date(ticket.dueAt) : null,
        createdAt,
        updatedAt,
      }
    );
    idMap.set(ticket.id, doc._id);
  }
  return idMap;
}

async function seedMessages(ticketIdMap, userIdMap, customerIdMap) {
  let count = 0;
  for (const message of messages) {
    const createdAt = new Date(message.createdAt);
    const isAgent = message.authorType === "agent";
    await upsert(
      Message,
      { legacyId: message.id },
      {
        ticket: ticketIdMap.get(message.ticketId),
        authorModel: isAgent ? "User" : "Customer",
        author: isAgent ? userIdMap.get(message.authorId) : customerIdMap.get(message.authorId),
        body: message.body,
        createdAt,
        updatedAt: createdAt,
      }
    );
    count += 1;
  }
  return count;
}

async function seedKnowledgeArticles(userIdMap) {
  let count = 0;
  for (const article of knowledgeArticles) {
    const updatedAt = new Date(article.updatedAt);
    await upsert(
      KnowledgeArticle,
      { legacyId: article.id },
      {
        title: article.title,
        category: article.category,
        excerpt: article.excerpt,
        author: userIdMap.get(article.authorId) ?? null,
        createdAt: updatedAt,
        updatedAt,
      }
    );
    count += 1;
  }
  return count;
}

async function seedNotifications(ticketIdMap, userIdMap) {
  let count = 0;
  for (const notification of notifications) {
    const createdAt = new Date(notification.createdAt);
    await upsert(
      Notification,
      { legacyId: notification.id },
      {
        type: notification.type,
        message: notification.message,
        relatedTicket: notification.relatedTicketId
          ? ticketIdMap.get(notification.relatedTicketId)
          : null,
        recipient: userIdMap.get(notification.recipientId),
        read: notification.read,
        createdAt,
        updatedAt: createdAt,
      }
    );
    count += 1;
  }
  return count;
}

async function verify(teamIdMap, userIdMap, customerIdMap, ticketIdMap) {
  const [teamCount, userCount, customerCount, ticketCount, messageCount, articleCount, notificationCount] =
    await Promise.all([
      Team.countDocuments(),
      User.countDocuments(),
      Customer.countDocuments(),
      Ticket.countDocuments(),
      Message.countDocuments(),
      KnowledgeArticle.countDocuments(),
      Notification.countDocuments(),
    ]);

  console.log("\nCollection counts:");
  console.log(`  teams:              ${teamCount} (expected ${teamIdMap.size})`);
  console.log(`  users:              ${userCount} (expected ${userIdMap.size})`);
  console.log(`  customers:          ${customerCount} (expected ${customerIdMap.size})`);
  console.log(`  tickets:            ${ticketCount} (expected ${ticketIdMap.size})`);
  console.log(`  messages:           ${messageCount} (expected ${messages.length})`);
  console.log(`  knowledgeArticles:  ${articleCount} (expected ${knowledgeArticles.length})`);
  console.log(`  notifications:      ${notificationCount} (expected ${notifications.length})`);

  const sampleTicket = await Ticket.findOne({ ticketNumber: "TCK-1042" })
    .populate("customer", "name email")
    .populate("team", "name")
    .populate("assignee", "name email")
    .lean();
  console.log("\nSample relationship check (TCK-1042):");
  console.log(`  customer: ${sampleTicket?.customer?.name} <${sampleTicket?.customer?.email}>`);
  console.log(`  team:     ${sampleTicket?.team?.name}`);
  console.log(`  assignee: ${sampleTicket?.assignee?.name} <${sampleTicket?.assignee?.email}>`);

  const orphanMessages = await Message.countDocuments({ ticket: null });
  const orphanTicketRefs = await Ticket.countDocuments({ customer: null });
  console.log(`\nOrphan check: messages without ticket=${orphanMessages}, tickets without customer=${orphanTicketRefs}`);
}

async function main() {
  await connectDB();
  console.log("Connected to MongoDB. Seeding...");

  const teamIdMap = await seedTeams();
  console.log(`Seeded teams: ${teamIdMap.size}`);

  const userIdMap = await seedUsers(teamIdMap);
  console.log(`Seeded users/agents: ${userIdMap.size}`);

  const customerIdMap = await seedCustomers();
  console.log(`Seeded customers: ${customerIdMap.size}`);

  const ticketIdMap = await seedTickets(teamIdMap, userIdMap, customerIdMap);
  console.log(`Seeded tickets: ${ticketIdMap.size}`);

  const messageCount = await seedMessages(ticketIdMap, userIdMap, customerIdMap);
  console.log(`Seeded messages: ${messageCount}`);

  const articleCount = await seedKnowledgeArticles(userIdMap);
  console.log(`Seeded knowledge articles: ${articleCount}`);

  const notificationCount = await seedNotifications(ticketIdMap, userIdMap);
  console.log(`Seeded notifications: ${notificationCount}`);

  await verify(teamIdMap, userIdMap, customerIdMap, ticketIdMap);

  console.log(`\nDone. Seeded agent and customer accounts use the placeholder password "${SEED_PASSWORD}".`);
  console.log(`Demo admin account: ${SEEDED_ADMIN_EMAIL}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
