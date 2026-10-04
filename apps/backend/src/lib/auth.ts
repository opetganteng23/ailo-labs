import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "ailo_session";
const ALG = "HS256";

export type Role = "super_admin" | "admin" | "staff_lab" | "dosen" | "borrower";

const ADMIN_ROLES: Role[] = ["super_admin", "admin", "staff_lab"];

/**
 * Admin/staff sessions expire after this many idle seconds; renewed on every admin request while active.
 * Used to be 5 minutes, which silently logged admins out mid-edit (typing in a rich text editor doesn't
 * trigger a request, so the idle clock kept running) and lost whatever they'd written. Now matches the
 * same 30-day window as other roles.
 */
export const ADMIN_IDLE_SECONDS = 60 * 60 * 24 * 30;

function secretKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for authentication.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string;
};

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export async function createSessionToken(payload: SessionPayload) {
  const expiresIn = isAdminRole(payload.role) ? `${ADMIN_IDLE_SECONDS}s` : "30d";
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads the session from the Next.js cookies() store — for use in Server Components / Server Actions. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Reads + authorizes the session from a NextRequest — for use in Route Handlers. Omit `roles` to just require any logged-in account. */
export async function requireSession(request: NextRequest, roles?: Role[]) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || (roles && !roles.includes(session.role))) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

/** Same as requireSession, but defaults to requiring one of the admin/staff roles. */
export async function requireAdmin(request: NextRequest, roles: Role[] = ADMIN_ROLES) {
  return requireSession(request, roles);
}
