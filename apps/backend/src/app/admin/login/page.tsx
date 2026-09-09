import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";

import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && isAdminRole(session.role)) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}
