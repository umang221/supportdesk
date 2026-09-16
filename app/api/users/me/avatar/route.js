import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { uploadAvatar } from "@/server/attachments/avatarService";
import { updateOwnAvatar } from "@/server/services/userService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Uploads a new avatar for the signed-in staff user and persists its URL. */
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");

  try {
    const avatarUrl = await uploadAvatar("users", user.id, file);
    const updated = await updateOwnAvatar(user.id, avatarUrl);
    return NextResponse.json({ user: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
