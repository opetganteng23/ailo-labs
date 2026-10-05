import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

import { ImageUploadField } from "@/components/ImageUploadField";

import { HeroSection } from "./HeroSection";
import { MarqueeEditor } from "./MarqueeEditor";
import { SectionBackgroundRow } from "./SectionBackgroundRow";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type Settings = {
  about?: { kicker?: string; title?: string; body?: string; image?: string; pillars?: { title?: string; text?: string; href?: string }[] };
  contact?: { email?: string; phone?: string; address?: string; address2?: string };
  socialMedia?: { instagram?: string; linkedin?: string; youtube?: string };
  homepage?: {
    heroBackgroundImages?: string[];
    heroOverlayOpacity?: number;
    researchBackgroundImages?: string[];
    researchOverlayOpacity?: number;
    projectsBackgroundImages?: string[];
    projectsOverlayOpacity?: number;
    teamBackgroundImages?: string[];
    teamOverlayOpacity?: number;
    newsBackgroundImages?: string[];
    newsOverlayOpacity?: number;
    heroKicker?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    stat1Value?: string;
    stat1Label?: string;
    stat2Value?: string;
    stat2Label?: string;
    stat3Value?: string;
    stat3Label?: string;
    marqueeItems?: { bold?: string; text?: string; image?: string }[];
  };
};

const NAV = [
  { href: "#general", label: "General" },
  { href: "#social", label: "Social links" },
  { href: "#hero", label: "Homepage hero" },
  { href: "#about", label: "About section" },
  { href: "#marquee", label: "Scrolling strip" },
  { href: "#backgrounds", label: "Section backgrounds" },
];

export default async function AdminSettingsPage() {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "global" }).lean<Settings>();
  const homepage = settings?.homepage ?? {};

  return (
    <form action={updateSettingsAction}>
      <div className="admin2-header">
        <div>
          <h1>Settings</h1>
          <p>Contact details, social links and how the homepage looks.</p>
        </div>
        <div className="admin2-actions" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7573" }}>Changes apply after saving</span>
          <button type="submit" className="admin2-btn">
            Save changes
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <nav aria-label="Settings sections" style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 20 }}>
          {NAV.map((n, i) => (
            <a
              key={n.href}
              href={n.href}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: i === 0 ? "#fff" : "transparent",
                border: i === 0 ? "1px solid #e3e1da" : "1px solid transparent",
                fontSize: 14,
                fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? "#15201f" : "#4e5957",
                textDecoration: "none",
              }}
            >
              {n.label}
            </a>
          ))}
          <Link href="/admin/chatbot/model" style={{ padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#4e5957" }}>
            AI &amp; chatbot
          </Link>
        </nav>

        <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <section id="general" className="admin2-section">
            <h2 style={{ fontSize: 17 }}>Contact</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="cemail">Email</label>
                <input id="cemail" name="email" type="email" defaultValue={settings?.contact?.email ?? ""} />
              </div>
              <div className="admin2-field">
                <label htmlFor="cphone">Phone</label>
                <input id="cphone" name="phone" type="tel" defaultValue={settings?.contact?.phone ?? ""} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="caddr">Address</label>
                <input id="caddr" name="address" type="text" defaultValue={settings?.contact?.address ?? ""} />
              </div>
              <div className="admin2-field">
                <label htmlFor="caddr2">Second address (optional)</label>
                <input id="caddr2" name="address2" type="text" placeholder="e.g. a second campus or office" defaultValue={settings?.contact?.address2 ?? ""} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#6b7573" }}>
              Each shows as its own block in the footer, side by side - don&apos;t combine two addresses into one field with commas, it makes the footer very tall.
            </p>
          </section>

          <section id="social" className="admin2-section">
            <h2 style={{ fontSize: 17 }}>Social links</h2>
            <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
              <label htmlFor="ig" style={{ fontSize: 14, fontWeight: 600 }}>
                Instagram
              </label>
              <input id="ig" name="instagram" type="url" defaultValue={settings?.socialMedia?.instagram ?? ""} style={{ height: 44 }} />
              <label htmlFor="li" style={{ fontSize: 14, fontWeight: 600 }}>
                LinkedIn
              </label>
              <input id="li" name="linkedin" type="url" defaultValue={settings?.socialMedia?.linkedin ?? ""} style={{ height: 44 }} />
              <label htmlFor="yt" style={{ fontSize: 14, fontWeight: 600 }}>
                YouTube
              </label>
              <input id="yt" name="youtube" type="url" defaultValue={settings?.socialMedia?.youtube ?? ""} style={{ height: 44 }} />
            </div>
          </section>

          <HeroSection
            images={homepage.heroBackgroundImages}
            opacity={homepage.heroOverlayOpacity}
            heroKicker={homepage.heroKicker}
            heroTitle={homepage.heroTitle}
            heroSubtitle={homepage.heroSubtitle}
            ctaText={homepage.ctaText}
            ctaLink={homepage.ctaLink}
            secondaryCtaText={homepage.secondaryCtaText}
            secondaryCtaLink={homepage.secondaryCtaLink}
            stat1Value={homepage.stat1Value}
            stat1Label={homepage.stat1Label}
            stat2Value={homepage.stat2Value}
            stat2Label={homepage.stat2Label}
            stat3Value={homepage.stat3Value}
            stat3Label={homepage.stat3Label}
          />

          <section id="about" className="admin2-panel">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eeece6" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>About section</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>The &quot;About&quot; block on the homepage. Leave a field empty to use the default text.</p>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="aboutKicker">Small label above the heading</label>
                <input id="aboutKicker" name="aboutKicker" type="text" maxLength={40} defaultValue={settings?.about?.kicker ?? ""} placeholder="ABOUT AILO" />
              </div>
              <div className="admin2-field">
                <label htmlFor="aboutTitle">Heading</label>
                <input id="aboutTitle" name="aboutTitle" type="text" maxLength={140} defaultValue={settings?.about?.title ?? ""} placeholder="A Telkom University Center of Excellence for applied AI." />
              </div>
              <div className="admin2-field">
                <label htmlFor="aboutBody">Text</label>
                <textarea id="aboutBody" name="aboutBody" rows={8} defaultValue={settings?.about?.body ?? ""} placeholder="Write about AILO. A blank line starts a new paragraph." />
              </div>
              <ImageUploadField name="aboutImage" label="Photo (optional)" defaultValue={settings?.about?.image} hint="Shown next to the text. PNG, JPG or WEBP" />
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Cards beside the text</h3>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7573" }}>Shown when there is no photo. Cards left empty are not shown. Leave all three empty to use the default cards.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="admin2-triple">
                      <input name="aboutPillarTitle" type="text" maxLength={40} aria-label={`Card ${i + 1} title`} placeholder={`Card ${i + 1} title`} defaultValue={settings?.about?.pillars?.[i]?.title ?? ""} />
                      <input name="aboutPillarText" type="text" maxLength={120} aria-label={`Card ${i + 1} text`} placeholder="Short text" defaultValue={settings?.about?.pillars?.[i]?.text ?? ""} />
                      <input name="aboutPillarHref" type="text" aria-label={`Card ${i + 1} link`} placeholder="/research" defaultValue={settings?.about?.pillars?.[i]?.href ?? ""} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="marquee" className="admin2-panel">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eeece6" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Scrolling strip</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                The running text under the hero (&quot;Optimization · Reinforcement Learning · ...&quot;). Scrolls automatically; each item is text or an image.
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <MarqueeEditor items={homepage.marqueeItems} />
            </div>
          </section>

          <section id="backgrounds" className="admin2-panel">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eeece6" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Section backgrounds</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                Optional images behind other homepage sections. Add more than one to make it a slideshow.
              </p>
            </div>
            <SectionBackgroundRow zone="research" label="Research" images={homepage.researchBackgroundImages} opacity={homepage.researchOverlayOpacity} />
            <SectionBackgroundRow zone="projects" label="Projects" images={homepage.projectsBackgroundImages} opacity={homepage.projectsOverlayOpacity} />
            <SectionBackgroundRow zone="team" label="Team" images={homepage.teamBackgroundImages} opacity={homepage.teamOverlayOpacity} />
            <SectionBackgroundRow zone="news" label="News" images={homepage.newsBackgroundImages} opacity={homepage.newsOverlayOpacity} isLast />
          </section>
        </div>
      </div>
    </form>
  );
}
