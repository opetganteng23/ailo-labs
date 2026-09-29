import { MinimalSiteHeader } from "@/components/MinimalSiteHeader";

import { JoinForm } from "./JoinForm";

export default function JoinPage() {
  return (
    <>
      <MinimalSiteHeader rightLabel="Already registered? Check status" rightHref="mailto:ailo@telkomuniversity.ac.id" />
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>MEMBERSHIP</span>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}>Become an AILO member</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4e5957" }}>
            Takes about five minutes. Our team reviews every request before a member card is issued.
          </p>
        </div>
        <JoinForm />
      </main>
    </>
  );
}
