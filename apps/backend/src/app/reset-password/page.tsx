import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Reset password · AILO" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
