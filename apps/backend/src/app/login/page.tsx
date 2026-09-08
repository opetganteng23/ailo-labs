import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <LoginForm />
      <SiteFooter />
    </>
  );
}
