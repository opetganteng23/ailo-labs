import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import { JoinForm } from "./JoinForm";

export default function JoinPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ maxWidth: 520, paddingTop: 48, paddingBottom: 48 }}>
        <h1>Join AILO</h1>
        <p style={{ marginTop: 8, color: "#5b6469" }}>
          Apply for AILO membership. An admin reviews every application and, once approved, you&apos;ll get a digital
          member card by email.
        </p>
        <div style={{ marginTop: 24 }}>
          <JoinForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
