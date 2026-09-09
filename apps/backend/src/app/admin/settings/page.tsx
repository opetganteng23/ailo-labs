import { MultiImageUploadField } from "@/components/MultiImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type Settings = {
  contact?: { email?: string; phone?: string; address?: string };
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
  };
};

function SectionBackgroundFields({
  zone,
  label,
  images,
  opacity,
}: {
  zone: string;
  label: string;
  images?: string[];
  opacity?: number;
}) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 4, padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label} background</p>
      <MultiImageUploadField name={`${zone}BackgroundImages`} label="Images (add more than one to slide)" defaultValues={images} />
      <label style={{ marginTop: 10 }}>
        Overlay opacity ({opacity ?? 88}%)
        <input
          type="range"
          name={`${zone}OverlayOpacity`}
          min={0}
          max={100}
          defaultValue={opacity ?? 88}
        />
      </label>
    </div>
  );
}

export default async function AdminSettingsPage() {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "global" }).lean<Settings>();
  const homepage = settings?.homepage ?? {};

  return (
    <div>
      <h1>Site Settings</h1>
      <form className="stack" action={updateSettingsAction} style={{ marginTop: 24 }}>
        <label>
          Contact email
          <input name="email" defaultValue={settings?.contact?.email ?? ""} />
        </label>
        <label>
          Contact phone
          <input name="phone" defaultValue={settings?.contact?.phone ?? ""} />
        </label>
        <label>
          Address
          <input name="address" defaultValue={settings?.contact?.address ?? ""} />
        </label>
        <label>
          Instagram URL
          <input name="instagram" defaultValue={settings?.socialMedia?.instagram ?? ""} />
        </label>
        <label>
          LinkedIn URL
          <input name="linkedin" defaultValue={settings?.socialMedia?.linkedin ?? ""} />
        </label>
        <label>
          YouTube URL
          <input name="youtube" defaultValue={settings?.socialMedia?.youtube ?? ""} />
        </label>

        <h2 style={{ marginTop: 16 }}>Homepage Hero</h2>
        <p style={{ color: "#5b6469", fontSize: 13, marginTop: -8 }}>
          Leave a field blank to keep the default text shown on the homepage.
        </p>
        <SectionBackgroundFields zone="hero" label="Hero" images={homepage.heroBackgroundImages} opacity={homepage.heroOverlayOpacity} />
        <label>
          Kicker text (small label above the headline)
          <input name="heroKicker" placeholder="TELKOM UNIVERSITY, CENTER OF EXCELLENCE" defaultValue={homepage.heroKicker ?? ""} />
        </label>
        <label>
          Headline
          <input name="heroTitle" placeholder="Learning systems that optimize how research gets done." defaultValue={homepage.heroTitle ?? ""} />
        </label>
        <label>
          Subheading
          <textarea
            name="heroSubtitle"
            placeholder="AILO designs and applies AI-driven optimization methods across research, teaching labs, and campus infrastructure, turning open questions into working systems."
            defaultValue={homepage.heroSubtitle ?? ""}
          />
        </label>
        <label>
          Primary button text
          <input name="ctaText" placeholder="Explore our research" defaultValue={homepage.ctaText ?? ""} />
        </label>
        <label>
          Primary button link
          <input name="ctaLink" placeholder="#research" defaultValue={homepage.ctaLink ?? ""} />
        </label>
        <label>
          Secondary button text
          <input name="secondaryCtaText" placeholder="Book a lab" defaultValue={homepage.secondaryCtaText ?? ""} />
        </label>
        <label>
          Secondary button link
          <input name="secondaryCtaLink" placeholder="#labs" defaultValue={homepage.secondaryCtaLink ?? ""} />
        </label>

        <div className="grid cols-3">
          <label>
            Stat 1 value
            <input name="stat1Value" placeholder="18+" defaultValue={homepage.stat1Value ?? ""} />
          </label>
          <label>
            Stat 1 label
            <input name="stat1Label" placeholder="Active projects" defaultValue={homepage.stat1Label ?? ""} />
          </label>
          <label>
            Stat 2 value
            <input name="stat2Value" placeholder="32" defaultValue={homepage.stat2Value ?? ""} />
          </label>
          <label>
            Stat 2 label
            <input name="stat2Label" placeholder="Researchers" defaultValue={homepage.stat2Label ?? ""} />
          </label>
          <label>
            Stat 3 value
            <input name="stat3Value" placeholder="6" defaultValue={homepage.stat3Value ?? ""} />
          </label>
          <label>
            Stat 3 label
            <input name="stat3Label" placeholder="Labs & facilities" defaultValue={homepage.stat3Label ?? ""} />
          </label>
        </div>

        <h2 style={{ marginTop: 16 }}>Other section backgrounds</h2>
        <p style={{ color: "#5b6469", fontSize: 13, marginTop: -8 }}>
          Optional. Leave empty to keep each section&apos;s plain background.
        </p>
        <SectionBackgroundFields zone="research" label="Research" images={homepage.researchBackgroundImages} opacity={homepage.researchOverlayOpacity} />
        <SectionBackgroundFields zone="projects" label="Projects" images={homepage.projectsBackgroundImages} opacity={homepage.projectsOverlayOpacity} />
        <SectionBackgroundFields zone="team" label="Team" images={homepage.teamBackgroundImages} opacity={homepage.teamOverlayOpacity} />
        <SectionBackgroundFields zone="news" label="News" images={homepage.newsBackgroundImages} opacity={homepage.newsOverlayOpacity} />

        <button type="submit" className="btn">
          Save
        </button>
      </form>
    </div>
  );
}
