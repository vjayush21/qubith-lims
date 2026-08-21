import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, type SessionPayload } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function jsonError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.issues },
      { status: 400 }
    );
  }
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error("API error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function withAuth<T>(
  req: NextRequest,
  handler: (session: SessionPayload) => Promise<T>
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await handler(session);
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}

export async function withTenant<T>(
  req: NextRequest,
  handler: (session: SessionPayload & { tenantId: string }) => Promise<T>
): Promise<NextResponse> {
  return withAuth(req, async (session) => {
    if (!session.tenantId) {
      throw new ApiError(403, "No tenant context", "NO_TENANT");
    }
    return handler(session as SessionPayload & { tenantId: string });
  });
}
