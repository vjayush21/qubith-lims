import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser, createSessionToken, setSessionCookie, logAudit } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);
    const user = await loginUser(data.email, data.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const token = await createSessionToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });
    await setSessionCookie(token);
    await logAudit("login", {
      tenantId: user.tenantId,
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
