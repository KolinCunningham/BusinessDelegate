"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "admin@cragtrails.app";
const ADMIN_PASSWORD = "demo";
const SESSION_COOKIE = "cragtrails_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 4; // 4 hours

export type AdminSession = {
  role: "admin";
  email: string;
  loggedInAt: string;
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const session: AdminSession = {
      role: "admin",
      email: ADMIN_EMAIL,
      loggedInAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return { success: true };
  }

  return { success: false, error: "Invalid credentials. Use the demo login exactly." };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin");
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value) as AdminSession;
    if (session.role === "admin" && session.email === ADMIN_EMAIL) {
      return session;
    }
  } catch {
    // invalid cookie
  }
  return null;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }
  return session;
}
