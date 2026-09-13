import { teams } from "./teams";
import { agents } from "./agents";
import { customers } from "./customers";
import { tickets } from "./tickets";
import { messages } from "./messages";
import { knowledgeArticles } from "./knowledge-articles";
import { notifications } from "./notifications";

/**
 * Lookup helpers over the mock fixtures, shaped like the accessors a future
 * API/DB-backed data layer would expose (e.g. server/services/*). Pages and
 * components should go through these rather than importing the raw arrays
 * directly, so swapping this module for real data later only touches one file.
 */

export function getTeamById(teamId) {
  return teams.find((team) => team.id === teamId) ?? null;
}

export function getAgentById(agentId) {
  return agents.find((agent) => agent.id === agentId) ?? null;
}

export function getCustomerById(customerId) {
  return customers.find((customer) => customer.id === customerId) ?? null;
}

export function getTicketById(ticketId) {
  return tickets.find((ticket) => ticket.id === ticketId) ?? null;
}

export function getTicketsByStatus(status) {
  return tickets.filter((ticket) => ticket.status === status);
}

export function getTicketsByAssignee(agentId) {
  return tickets.filter((ticket) => ticket.assigneeId === agentId);
}

export function getUnassignedTickets() {
  return tickets.filter((ticket) => !ticket.assigneeId);
}

export function getMessagesByTicketId(ticketId) {
  return messages
    .filter((message) => message.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function getKnowledgeArticleById(articleId) {
  return knowledgeArticles.find((article) => article.id === articleId) ?? null;
}

export function getNotificationsByRecipient(agentId) {
  return notifications
    .filter((notification) => notification.recipientId === agentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getUnreadNotificationCount(agentId) {
  return notifications.filter((n) => n.recipientId === agentId && !n.read).length;
}
