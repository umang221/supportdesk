export const messages = [
  // TCK-1042 — export to CSV
  {
    id: "msg-1042-1",
    ticketId: "TCK-1042",
    authorType: "customer",
    authorId: "cust-05",
    body: "When I click 'Export' on the invoice history page, the download starts but the CSV file is empty. This worked fine last month.",
    createdAt: "2026-09-11T14:20:00Z",
  },
  {
    id: "msg-1042-2",
    ticketId: "TCK-1042",
    authorType: "agent",
    authorId: "agent-03",
    body: "Thanks for the report, Meera. Could you confirm which date range you selected for the export, and whether this happens for every range or a specific one?",
    createdAt: "2026-09-11T15:02:00Z",
  },
  {
    id: "msg-1042-3",
    ticketId: "TCK-1042",
    authorType: "customer",
    authorId: "cust-05",
    body: "It happens for any range longer than 30 days. Anything shorter exports fine.",
    createdAt: "2026-09-12T09:05:00Z",
  },

  // TCK-1041 — webhook signature failing
  {
    id: "msg-1041-1",
    ticketId: "TCK-1041",
    authorType: "customer",
    authorId: "cust-10",
    body: "About 1 in 20 webhook deliveries are failing signature verification on our end, but retries usually succeed. Can you check if the signing secret is rotating unexpectedly?",
    createdAt: "2026-09-12T08:40:00Z",
  },
  {
    id: "msg-1041-2",
    ticketId: "TCK-1041",
    authorType: "agent",
    authorId: "agent-05",
    body: "Escalating this to engineering now — this smells like a clock-skew issue on the timestamp used in the signature, not a secret rotation. I'll update you within the hour.",
    createdAt: "2026-09-13T07:15:00Z",
  },

  // TCK-1040 — refund duplicate charge
  {
    id: "msg-1040-1",
    ticketId: "TCK-1040",
    authorType: "customer",
    authorId: "cust-02",
    body: "We were charged twice for our September subscription — invoices INV-3381 and INV-3382 are identical. Please refund one of them.",
    createdAt: "2026-09-10T11:05:00Z",
  },
  {
    id: "msg-1040-2",
    ticketId: "TCK-1040",
    authorType: "agent",
    authorId: "agent-04",
    body: "Confirmed the duplicate charge on our end — apologies for the inconvenience. I've submitted a refund for INV-3382; it should post to your card within 5-7 business days.",
    createdAt: "2026-09-11T16:30:00Z",
  },

  // TCK-1036 — SSO redirect loop
  {
    id: "msg-1036-1",
    ticketId: "TCK-1036",
    authorType: "customer",
    authorId: "cust-03",
    body: "Since this morning, every login through Okta redirects back to the login page in a loop. None of our staff can get in. This is blocking our whole clinic.",
    createdAt: "2026-09-09T15:30:00Z",
  },
  {
    id: "msg-1036-2",
    ticketId: "TCK-1036",
    authorType: "agent",
    authorId: "agent-05",
    body: "I can reproduce this — it looks like the ACS URL configured in your Okta app doesn't match our current callback URL after last week's domain change. Sending you the updated value now.",
    createdAt: "2026-09-10T09:00:00Z",
  },
  {
    id: "msg-1036-3",
    ticketId: "TCK-1036",
    authorType: "customer",
    authorId: "cust-03",
    body: "Updated the ACS URL in Okta but we're still seeing the loop for about half our users. Following up again since this has now been down over a day.",
    createdAt: "2026-09-11T10:00:00Z",
  },

  // TCK-1035 — mobile app crash on upload
  {
    id: "msg-1035-1",
    ticketId: "TCK-1035",
    authorType: "customer",
    authorId: "cust-04",
    body: "The iOS app crashes every time I attach a file bigger than around 10MB to a ticket. Android seems fine.",
    createdAt: "2026-09-08T12:00:00Z",
  },
  {
    id: "msg-1035-2",
    ticketId: "TCK-1035",
    authorType: "agent",
    authorId: "agent-02",
    body: "Thanks Jason — this is a known issue with the iOS attachment picker that's already scheduled in the next app release. I'll put this on hold and let you know as soon as the fix ships.",
    createdAt: "2026-09-10T14:20:00Z",
  },

  // TCK-1030 — Slack integration stopped posting
  {
    id: "msg-1030-1",
    ticketId: "TCK-1030",
    authorType: "customer",
    authorId: "cust-06",
    body: "Our #support-tickets Slack channel hasn't received a new-ticket notification since yesterday afternoon, even though tickets are still coming in.",
    createdAt: "2026-09-13T06:10:00Z",
  },
];
