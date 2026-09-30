import { MinimalSiteHeader } from "@/components/MinimalSiteHeader";

import { JoinForm } from "./JoinForm";

export default function JoinPage() {
  return (
    <>
      <MinimalSiteHeader rightLabel="Questions? Contact us" rightHref="/contact" />
      <main className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>MEMBERSHIP</span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}>Become an AILO member</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#4e5957" }}>
            Takes about five minutes. Our team reviews every request before a member card is issued.
          </p>
        </div>
        <JoinForm />
      </main>
    </>
  );
}
