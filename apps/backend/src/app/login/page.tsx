import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";

import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · AILO" };

export default async function LoginPage() {
  const session = await getSession();
  if (session && isAdminRole(session.role)) redirect("/admin/dashboard");
  if (session?.role === "dosen") redirect("/dosen");
  return <LoginForm />;
}
