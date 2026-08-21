import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, logAudit, getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await logAudit("logout", {
      tenantId: session.tenantId,
      userId: session.userId,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
