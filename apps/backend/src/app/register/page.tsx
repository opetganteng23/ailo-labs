import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <RegisterForm />
      <SiteFooter />
    </>
  );
}
