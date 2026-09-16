import { describe, it, expect, afterAll } from "vitest";
import Team from "@/server/models/Team";
import User from "@/server/models/User";
import Ticket from "@/server/models/Ticket";
import Customer from "@/server/models/Customer";
import { PRIORITIES } from "@/lib/constants/priorities";
import { createTeam, updateTeam, deleteTeam } from "@/server/services/teamService";
import { createTicket } from "@/server/services/ticketService";
import { createTestTeam, createTestUser, createTestCustomer } from "../helpers/factories";

const createdTeamIds = [];
const createdUserIds = [];
const createdCustomerIds = [];
const createdTicketIds = [];

afterAll(async () => {
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
});

async function actingAdmin() {
  const { user } = await createTestUser({ role: "admin" });
  createdUserIds.push(user._id);
  return user;
}

describe("teamService — rename", () => {
  it("updateTeam renames a team's name and description", async () => {
    const admin = await actingAdmin();
    const team = await createTestTeam({ name: `Original ${Date.now()}` });
    createdTeamIds.push(team._id);

    const renamed = await updateTeam(team._id.toString(), { name: "Renamed Team", description: "New description" }, admin);
    expect(renamed.name).toBe("Renamed Team");
    expect(renamed.description).toBe("New description");

    const fromDb = await Team.findById(team._id);
    expect(fromDb.name).toBe("Renamed Team");
  });

  it("updateTeam returns null for a nonexistent team", async () => {
    const admin = await actingAdmin();
    const result = await updateTeam("000000000000000000000000", { name: "Doesn't matter" }, admin);
    expect(result).toBeNull();
  });
});

describe("teamService — duplicate name rejection", () => {
  it("createTeam rejects a name that already exists", async () => {
    const admin = await actingAdmin();
    const existing = await createTestTeam({ name: `Dup Source ${Date.now()}` });
    createdTeamIds.push(existing._id);

    await expect(createTeam({ name: existing.name, description: "" }, admin)).rejects.toMatchObject({
      status: 409,
      fieldErrors: { name: expect.any(String) },
    });
  });

  it("updateTeam (rename) rejects renaming to a name that already exists", async () => {
    const admin = await actingAdmin();
    const teamA = await createTestTeam({ name: `Team A ${Date.now()}` });
    createdTeamIds.push(teamA._id);
    const teamB = await createTestTeam({ name: `Team B ${Date.now()}` });
    createdTeamIds.push(teamB._id);

    await expect(updateTeam(teamB._id.toString(), { name: teamA.name }, admin)).rejects.toMatchObject({
      status: 409,
      fieldErrors: { name: expect.any(String) },
    });

    // The rejected rename must not have partially applied.
    const fromDb = await Team.findById(teamB._id);
    expect(fromDb.name).toBe(teamB.name);
  });
});

describe("teamService — validation (empty names)", () => {
  it("createTeam requires a non-empty name (enforced by the model)", async () => {
    const admin = await actingAdmin();
    await expect(createTeam({ name: "", description: "" }, admin)).rejects.toThrow();
  });
});

describe("teamService — delete", () => {
  it("deleteTeam removes a team with no members or tickets", async () => {
    const admin = await actingAdmin();
    const team = await createTestTeam({ name: `Empty Team ${Date.now()}` });

    const result = await deleteTeam(team._id.toString(), admin);
    expect(result).toBe(true);
    expect(await Team.findById(team._id)).toBeNull();
  });

  it("deleteTeam returns null for a nonexistent team", async () => {
    const admin = await actingAdmin();
    const result = await deleteTeam("000000000000000000000000", admin);
    expect(result).toBeNull();
  });

  it("deleteTeam with members unassigns agents rather than deleting or blocking on them", async () => {
    const admin = await actingAdmin();
    const team = await createTestTeam({ name: `Team With Agents ${Date.now()}` });
    const { user: agent1 } = await createTestUser({ role: "agent", team: team._id });
    createdUserIds.push(agent1._id);
    const { user: agent2 } = await createTestUser({ role: "agent", team: team._id });
    createdUserIds.push(agent2._id);

    const result = await deleteTeam(team._id.toString(), admin);
    expect(result).toBe(true);

    // Agents remain in the system, just unassigned — not deleted.
    const refetchedAgent1 = await User.findById(agent1._id);
    const refetchedAgent2 = await User.findById(agent2._id);
    expect(refetchedAgent1).not.toBeNull();
    expect(refetchedAgent1.team).toBeNull();
    expect(refetchedAgent2).not.toBeNull();
    expect(refetchedAgent2.team).toBeNull();
  });

  it("deleteTeam refuses to delete a team that still has tickets, and leaves the team/ticket intact", async () => {
    const admin = await actingAdmin();
    const team = await createTestTeam({ name: `Team With Tickets ${Date.now()}` });
    createdTeamIds.push(team._id);
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    const ticket = await createTicket({
      subject: "Needs this team to keep existing",
      customer: customer._id.toString(),
      team: team._id.toString(),
      priority: PRIORITIES.MEDIUM,
      channel: "email",
    });
    createdTicketIds.push(ticket._id);

    await expect(deleteTeam(team._id.toString(), admin)).rejects.toMatchObject({
      status: 409,
      code: "team_has_tickets",
    });

    // Nothing was touched — the team and the ticket's team reference both survive.
    expect(await Team.findById(team._id)).not.toBeNull();
    const refetchedTicket = await Ticket.findById(ticket._id);
    expect(refetchedTicket.team.toString()).toBe(team._id.toString());
  });
});
