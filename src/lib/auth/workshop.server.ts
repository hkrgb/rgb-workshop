import { getRequest } from "@tanstack/react-start/server";
import { ALLOWED_EMAIL, isAllowedEmail } from "@/lib/allowlist";
import { authConfigured } from "./server";
import { assertSameSiteRequest } from "./isolation.server";
import {
  DEV_USER_ID,
  UnauthorizedError,
  getSessionUser,
} from "./verify.server";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function bearerFromRequest(): string | undefined {
  const request = getRequest();
  if (!request) return undefined;
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  if (!header.toLowerCase().startsWith("bearer ")) return undefined;
  return header.slice(7).trim() || undefined;
}

/**
 * Auth + allowlist for API routes (upload). Session from cookie or bearer.
 */
export async function requireWorkshopFromRequest(): Promise<{
  id: string;
  email: string | null;
}> {
  assertSameSiteRequest();

  if (!authConfigured) {
    if (databaseConfigured()) throw new UnauthorizedError();
    return { id: DEV_USER_ID, email: ALLOWED_EMAIL };
  }

  const user = await getSessionUser(bearerFromRequest());
  if (!user) throw new UnauthorizedError();
  if (!isAllowedEmail(user.email)) {
    throw new ForbiddenError("This workspace is private.");
  }
  return { id: user.id, email: user.email };
}

/**
 * Auth + allowlist for createServerFn handlers that already have a verified userId.
 */
export async function assertWorkshopUser(userId: string): Promise<void> {
  if (!authConfigured) {
    if (databaseConfigured()) throw new UnauthorizedError();
    if (userId !== DEV_USER_ID) throw new UnauthorizedError();
    return;
  }

  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ email: string }>`
    select email from "user" where id = ${userId} limit 1
  `;
  if (!isAllowedEmail(rows[0]?.email)) {
    throw new ForbiddenError("This workspace is private.");
  }
}
