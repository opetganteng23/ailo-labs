import { SiteFooter } from "@/components/SiteFooter";
import { MinimalSiteHeader } from "@/components/MinimalSiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

import { ContactForm } from "./ContactForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contact · AILO" };

export default async function ContactPage() {
  let contact: { email?: string; phone?: string; address?: string; address2?: string } = {};
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "global" }).lean<{ contact?: typeof contact }>();
    contact = settings?.contact ?? {};
  } catch {
    // Contact details are optional on this page.
  }

  return (
    <>
      <MinimalSiteHeader />
      <main className="wrap" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>CONTACT</span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}>Get in touch with AILO</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#4e5957", maxWidth: 640 }}>
            Questions about research, collaboration, labs or membership? Send us a message and the team will reply by email.
          </p>
        </div>
        <div className="contact-layout">
          <ContactForm />
          <aside className="contact-aside">
            {contact.email && (
              <div>
                <span>Email</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div>
                <span>Phone</span>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>
              </div>
            )}
            <div>
              <span>Address</span>
              <p>{contact.address || "CoE AILO, Telkom University, Bandung"}</p>
            </div>
            {contact.address2 && (
              <div>
                <span>Second address</span>
                <p>{contact.address2}</p>
              </div>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
