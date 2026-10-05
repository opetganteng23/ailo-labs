import { connectToDatabase } from "@/lib/mongodb";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { Partner } from "@/models/catalog";
import { Lab } from "@/models/Lab";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { SiteSettings } from "@/models/SiteSettings";
import { Team } from "@/models/Team";

export type HomepageSettings = {
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

export type ResearchCard = { title: string; description: string; slug: string };
export type ProjectCard = { title: string; description: string; slug: string; status: string; image?: string };
export type NewsCard = { title: string; summary: string; slug: string; category: string; publishedAt?: string; image?: string };
export type TeamCard = {
  name: string;
  position: string;
  slug: string;
  photo?: string;
  category?: string;
  hIndex?: number;
  documentCount?: number;
  badges: string[];
};
export type LabRow = { name: string; meta: string; status: "open" | "busy" };
export type StripItem = { bold?: string; text?: string; image?: string; dark?: boolean };

export type HomeData = {
  homepage?: HomepageSettings;
  contact?: { email?: string; phone?: string; address?: string; address2?: string };
  socialMedia?: { instagram?: string; linkedin?: string; youtube?: string };
  research: ResearchCard[];
  projects: ProjectCard[];
  news: NewsCard[];
  team: TeamCard[];
  teamCategories: string[];
  labs: LabRow[];
  /** null = nothing to show (hide the strip); undefined = fall back to the built-in sample items */
  strip: StripItem[] | null | undefined;
};

/** Loads everything the homepage shows. Any failure degrades to "no data", and the sections fall back to their samples. */
export async function getHomeData(): Promise<HomeData> {
  const empty: HomeData = { research: [], projects: [], news: [], team: [], teamCategories: [], labs: [], strip: undefined };
  try {
    await connectToDatabase();
    const [settings, research, projects, team, news, labs, partners, teamCategories] = await Promise.all([
      SiteSettings.findOne({ key: "global" }).lean<{
        homepage?: HomepageSettings;
        contact?: HomeData["contact"];
        socialMedia?: HomeData["socialMedia"];
      }>(),
      Research.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).limit(4).select("title description slug").lean<ResearchCard[]>(),
      Project.find({ publishStatus: { $nin: ["review", "archived"] } })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(4)
        .select("title description slug status images")
        .lean<{ title: string; description: string; slug: string; status: string; images?: string[] }[]>(),
      Team.find({ isActive: true })
        .sort({ name: 1 })
        .limit(8)
        .select("name position slug photo category profiles scopusData")
        .lean<
          {
            name: string;
            position: string;
            slug: string;
            photo?: string;
            category?: string;
            profiles?: { scopus?: string; googleScholar?: string; sinta?: string };
            scopusData?: { hIndex?: number; documentCount?: number };
          }[]
        >(),
      News.find({ status: "published" })
        .sort({ publishedAt: -1 })
        .limit(3)
        .select("title summary slug category publishedAt images")
        .lean<{ title: string; summary: string; slug: string; category: string; publishedAt?: Date; images?: string[] }[]>(),
      Lab.find({ isActive: true }).sort({ name: 1 }).limit(4).select("name location capacity facilities").lean<{ name: string; location?: string; capacity?: number; facilities?: string }[]>(),
      Partner.find({ status: "published" }).sort({ order: 1, title: 1 }).select("title image logoDark").lean<{ title: string; image?: string; logoDark?: boolean }[]>(),
      listTeamCategories(),
    ]);

    // Published partners feed the strip, but only as logos (never as text); with no logo uploaded yet the strip stays hidden.
    // With no partners at all, the Settings strip items are used.
    const partnerLogos = partners.filter((p) => p.image).map((p) => ({ text: p.title, image: p.image, dark: p.logoDark }));
    const strip = partners.length > 0 ? (partnerLogos.length > 0 ? partnerLogos : null) : settings?.homepage?.marqueeItems?.length ? settings.homepage.marqueeItems : undefined;

    return {
      homepage: settings?.homepage,
      contact: settings?.contact,
      socialMedia: settings?.socialMedia,
      research,
      projects: projects.map((p) => ({ title: p.title, description: p.description, slug: p.slug, status: p.status, image: p.images?.[0] })),
      news: news.map((n) => ({ title: n.title, summary: n.summary, slug: n.slug, category: n.category, publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : undefined, image: n.images?.[0] })),
      team: team.map((t) => ({
        name: t.name,
        position: t.position,
        slug: t.slug,
        photo: t.photo,
        category: t.category,
        hIndex: t.scopusData?.hIndex,
        documentCount: t.scopusData?.documentCount,
        badges: [t.profiles?.scopus ? "Scopus" : null, t.profiles?.googleScholar ? "Scholar" : null, t.profiles?.sinta ? "SINTA" : null].filter(Boolean) as string[],
      })),
      teamCategories,
      labs: labs.map((l) => ({
        name: l.name,
        meta: [l.location, l.capacity ? `${l.capacity} people` : null, l.facilities].filter(Boolean).join(" · "),
        status: "open" as const,
      })),
      strip,
    };
  } catch (error) {
    console.error("Failed to load homepage dynamic content, serving defaults", error);
    return empty;
  }
}
