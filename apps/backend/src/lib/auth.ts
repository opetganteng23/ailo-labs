import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "ailo_session";
export const USER_SESSION_COOKIE = "ailo_user_session";
const ALG = "HS256";

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
  role: "super_admin" | "admin" | "staff_lab";
  name: string;
};

export type UserSessionPayload = {
  sub: string;
  email: string;
  role: "borrower";
  name: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
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

/** Reads + authorizes the session from a NextRequest — for use in Route Handlers. */
export async function requireAdmin(request: NextRequest, roles?: SessionPayload["role"][]) {
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

export async function createUserSessionToken(payload: UserSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyUserSessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

/** Reads the borrower session from the Next.js cookies() store — for use in Server Components / Server Actions. */
export async function getUserSession(): Promise<UserSessionPayload | null> {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyUserSessionToken(token);
}

/** Reads + authorizes the borrower session from a NextRequest — for use in Route Handlers. */
export async function requireUser(request: NextRequest) {
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const session = token ? await verifyUserSessionToken(token) : null;

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}
