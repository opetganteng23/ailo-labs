import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Forgot password · AILO" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <ForgotPasswordForm backHref={from === "admin" ? "/admin/login" : "/login"} />;
}
