import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { listAuditLogs } from "@/server/services/auditService";
import { toErrorResponse } from "@/server/utils/http-error";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { searchParams } = request.nextUrl;
    const result = await listAuditLogs({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
