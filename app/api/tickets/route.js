import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateCreateTicketInput } from "@/server/validators/ticketValidators";
import { listTickets, createTicket } from "@/server/services/ticketService";
import { toErrorResponse } from "@/server/utils/http-error";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const result = await listTickets(query);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const input = validateCreateTicketInput(body);
    const ticket = await createTicket(input);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = toErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
