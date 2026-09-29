import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

import { ContactForm } from "./ContactForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contact · AILO" };

export default async function ContactPage() {
  let contact: { email?: string; phone?: string; address?: string } = {};
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "global" }).lean<{ contact?: typeof contact }>();
    contact = settings?.contact ?? {};
  } catch {
    // Contact details are optional on this page.
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">CONTACT</span>
            <h1>Get in touch with AILO</h1>
          </div>
          <div className="sec-desc">
            <p>Questions about research, collaboration, labs or membership? Send us a message and the team will reply by email.</p>
          </div>
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
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
