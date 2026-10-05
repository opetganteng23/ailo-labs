import fs from "node:fs";
import path from "node:path";

import { connectToDatabase } from "@/lib/mongodb";
import { Partner } from "@/models/catalog";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { SiteSettings } from "@/models/SiteSettings";
import { Team } from "@/models/Team";

const homepagePath = path.join(process.cwd(), "public", "homepage.html");

export const dynamic = "force-dynamic";

type HomepageSettings = {
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

type CardResult = { html: string | null; count: number };

const DEFAULT_CONTACT = {
  email: "ailo@telkomuniversity.ac.id",
  phone: "+62 22 756 4108",
  address: "Gedung TULT, Telkom University, Bandung, Jawa Barat",
  address2: "",
};

function buildFooterContact(contact: { email?: string; phone?: string } | undefined): string {
  const email = contact?.email || DEFAULT_CONTACT.email;
  const phone = contact?.phone || DEFAULT_CONTACT.phone;
  return [
    `<a href="mailto:${escapeHtml(email)}" style="color:#fff;">${escapeHtml(email)}</a>`,
    `<span>${escapeHtml(phone)}</span>`,
  ].join("\n");
}

function buildFooterAddresses(contact: { address?: string; address2?: string } | undefined): string {
  const address = contact?.address || DEFAULT_CONTACT.address;
  const address2 = contact?.address2 || DEFAULT_CONTACT.address2;
  return [
    `<span class="foot-address">${escapeHtml(address)}</span>`,
    ...(address2 ? [`<span class="foot-address">${escapeHtml(address2)}</span>`] : []),
  ].join("\n");
}

const DEFAULT_MARQUEE_ITEMS: { bold: string; text: string }[] = [
  { bold: "Optimization", text: "Reinforcement Learning" },
  { bold: "NLP", text: "Retrieval-Augmented Generation" },
  { bold: "Computer Vision", text: "Edge Deployment" },
  { bold: "Applied ML", text: "Smart Campus Systems" },
];

/** Builds the running strip's content twice back to back so a CSS translateX(-50%) loop is seamless. */
function buildMarqueeItems(items: { bold?: string; text?: string; image?: string }[] | undefined): string {
  const list = items && items.length > 0 ? items : DEFAULT_MARQUEE_ITEMS;
  const renderItem = (item: { bold?: string; text?: string; image?: string }) =>
    item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.bold || item.text || "")}">`
      : `<span>${item.bold ? `<b>${escapeHtml(item.bold)}</b>` : ""}${item.bold && item.text ? " · " : ""}${escapeHtml(item.text || "")}</span>`;
  const sep = `<span class="sep"></span>`;
  const oneSet = list.map(renderItem).join(`\n${sep}\n`);
  return [oneSet, oneSet].join(`\n${sep}\n`);
}

const SOCIAL_LABELS: Record<"instagram" | "linkedin" | "youtube", string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

function buildFooterSocials(social: { instagram?: string; linkedin?: string; youtube?: string } | undefined): string {
  return (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[])
    .map((key) => {
      const href = social?.[key];
      const label = SOCIAL_LABELS[key];
      return href
        ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<span class="social-pending" title="Coming soon">${label}</span>`;
    })
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function setElementText(html: string, id: string, text: string | undefined): string {
  if (!text) return html;
  const re = new RegExp(`(<([a-zA-Z0-9]+)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`);
  return html.replace(re, (_match, open: string, _tag: string, close: string) => `${open}${escapeHtml(text)}${close}`);
}

function setElementHref(html: string, id: string, href: string | undefined): string {
  if (!href) return html;
  const re = new RegExp(`<a\\s[^>]*\\bid="${id}"[^>]*>`);
  return html.replace(re, (tag) => {
    if (/href="[^"]*"/.test(tag)) {
      return tag.replace(/href="[^"]*"/, `href="${escapeHtml(href)}"`);
    }
    return tag;
  });
}

/**
 * Injects a background image (+slideshow if >1 image) and a tinted overlay behind a
 * <section id="..."> element's content. The hero is a dark section with white text, so
 * it needs a dark overlay; the other sections are light and get a paper-colored one.
 */
function setSectionBackground(
  html: string,
  sectionId: string,
  images: string[] | undefined,
  opacityPercent: number | undefined,
  tone: "light" | "dark" = "light",
): string {
  const list = (images ?? []).filter(Boolean);
  if (list.length === 0) return html;

  const opacity = Math.max(0, Math.min(100, opacityPercent ?? (tone === "dark" ? 66 : 88))) / 100;
  const tint = tone === "dark" ? "6,32,36" : "251,249,246";
  const layers = `<div class="section-bg-layer" data-bg-images='${escapeHtml(JSON.stringify(list))}' style="background-image:url('${escapeHtml(list[0])}')"></div><div class="section-bg-overlay" style="background:rgba(${tint},${opacity})"></div>`;

  const re = new RegExp(`(<section\\b[^>]*\\bid="${sectionId}"[^>]*)(>)`);
  return html.replace(re, (_match, openTag: string, close: string) => {
    const withPosition = /style="/.test(openTag)
      ? openTag.replace(/style="/, 'style="position:relative;overflow:hidden;')
      : `${openTag} style="position:relative;overflow:hidden;"`;
    return `${withPosition}${close}${layers}`;
  });
}

function applyHeroSettings(html: string, hero: HomepageSettings): string {
  let out = html;
  out = setElementText(out, "hero-kicker", hero.heroKicker);
  out = setElementText(out, "hero-title", hero.heroTitle);
  out = setElementText(out, "hero-lede", hero.heroSubtitle);
  out = setElementText(out, "hero-cta-primary", hero.ctaText);
  out = setElementHref(out, "hero-cta-primary", hero.ctaLink);
  out = setElementText(out, "hero-cta-secondary", hero.secondaryCtaText);
  out = setElementHref(out, "hero-cta-secondary", hero.secondaryCtaLink);
  out = setElementText(out, "hero-stat-1-value", hero.stat1Value);
  out = setElementText(out, "hero-stat-1-label", hero.stat1Label);
  out = setElementText(out, "hero-stat-2-value", hero.stat2Value);
  out = setElementText(out, "hero-stat-2-label", hero.stat2Label);
  out = setElementText(out, "hero-stat-3-value", hero.stat3Value);
  out = setElementText(out, "hero-stat-3-label", hero.stat3Label);
  return out;
}

/** Replaces the content between "<!--MARKER_START-->" and "<!--MARKER_END-->" with `replacement`, if any replacement is given. */
function replaceBlock(html: string, marker: string, replacement: string | null): string {
  if (replacement === null) return html;
  const re = new RegExp(`<!--${marker}_START-->[\\s\\S]*?<!--${marker}_END-->`);
  return html.replace(re, replacement);
}

const RESEARCH_ICONS = [
  '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
  '<path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/>',
  '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
];

async function buildResearchCards(): Promise<CardResult> {
  const items = await Research.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(4)
    .select("title description slug")
    .lean<{ title: string; description: string; slug: string }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map(
      (item, i) => `
      <a class="rcard" href="/research/${escapeHtml(item.slug)}">
        <div class="rcard-top">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span class="ricon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${RESEARCH_ICONS[i % RESEARCH_ICONS.length]}</svg></span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(truncate(item.description, 110))}</p>
        <span class="explore">Explore</span>
      </a>`,
    )
    .join("\n");
  return { html, count: items.length };
}

const PROJECT_STATUS_LABEL: Record<string, string> = { planned: "Planned", ongoing: "Ongoing", completed: "Completed" };
const PROJECT_STATUS_CLASS: Record<string, string> = { planned: "status-planned", ongoing: "status-ongoing", completed: "status-completed" };

async function buildProjectCards(): Promise<CardResult> {
  const items = await Project.find({ publishStatus: { $nin: ["review", "archived"] } })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(4)
    .select("title description slug status images")
    .lean<{ title: string; description: string; slug: string; status: string; images?: string[] }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map((item, i) => {
      const image = item.images?.[0];
      const thumb = image
        ? `<div class="pcard-thumb" style="background-image:url('${escapeHtml(image)}');background-size:cover;background-position:center"></div>`
        : `<div class="pcard-thumb"></div>`;
      const statusClass = PROJECT_STATUS_CLASS[item.status] ?? "status-planned";
      const statusLabel = PROJECT_STATUS_LABEL[item.status] ?? item.status;
      return `
      <a class="pcard" href="/projects/${escapeHtml(item.slug)}">
        ${thumb}
        <div class="pcard-body">
          <div class="pcard-meta"><span class="num">P${i + 1}</span><span class="pstatus ${statusClass}">${escapeHtml(statusLabel)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(truncate(item.description, 110))}</p>
        </div>
      </a>`;
    })
    .join("\n");
  return { html, count: items.length };
}

async function buildTeamCards(): Promise<CardResult> {
  const items = await Team.find({ isActive: true })
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
        profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
        scopusData?: { hIndex?: number; documentCount?: number };
      }[]
    >();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map((item) => {
      const photoStyle = item.photo
        ? ` style="background-image:url('${escapeHtml(item.photo)}');background-size:cover;background-position:center;"`
        : "";
      const metrics =
        item.scopusData?.hIndex !== undefined
          ? `<div class="met">h-index ${item.scopusData.hIndex}${item.scopusData.documentCount ? ` · ${item.scopusData.documentCount} publications` : ""}</div>`
          : "";
      const badges = [
        item.profiles?.scopus ? "Scopus" : null,
        item.profiles?.googleScholar ? "Scholar" : null,
        item.profiles?.sinta ? "SINTA" : null,
      ].filter(Boolean) as string[];
      const badgeHtml = badges.length > 0 ? `<div class="tbadges">${badges.map((b) => `<span class="tbadge">${b}</span>`).join("")}</div>` : "";
      return `
      <a class="tcard" href="/team/${escapeHtml(item.slug)}" data-category="${escapeHtml(item.category ?? "")}">
        <div class="tphoto"${photoStyle}></div>
        <h4>${escapeHtml(item.name)}</h4>
        <div class="role">${escapeHtml(item.position)}</div>
        ${metrics}
        ${badgeHtml}
      </a>`;
    })
    .join("\n");
  return { html, count: items.length };
}

async function buildNewsCards(): Promise<CardResult> {
  const items = await News.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title summary slug category publishedAt images")
    .lean<{ title: string; summary: string; slug: string; category: string; publishedAt?: Date; images?: string[] }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map((item) => {
      const date = item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "";
      const image = item.images?.[0];
      const thumbStyle = image ? ` style="background-image:url('${escapeHtml(image)}');background-size:cover;background-position:center"` : "";
      return `
      <a class="ncard" href="/news/${escapeHtml(item.slug)}">
        <div class="nthumb"${thumbStyle}><span class="tag">${escapeHtml(item.category)}</span></div>
        <div class="nbody">
          <div class="date">${escapeHtml(date)}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(truncate(item.summary, 140))}</p>
          <span class="read">Read article</span>
        </div>
      </a>`;
    })
    .join("\n");
  return { html, count: items.length };
}

export async function GET() {
  let html = fs.readFileSync(homepagePath, "utf-8");

  try {
    await connectToDatabase();

    const [settingsDoc, research, projects, team, news] = await Promise.all([
      SiteSettings.findOne({ key: "global" }).lean<{
        homepage?: HomepageSettings;
        contact?: { email?: string; phone?: string; address?: string };
        socialMedia?: { instagram?: string; linkedin?: string; youtube?: string };
      }>(),
      buildResearchCards(),
      buildProjectCards(),
      buildTeamCards(),
      buildNewsCards(),
    ]);

    const homepage = settingsDoc?.homepage;
    if (homepage) {
      html = applyHeroSettings(html, homepage);
      html = setSectionBackground(html, "hero-section", homepage.heroBackgroundImages, homepage.heroOverlayOpacity, "dark");
      html = setSectionBackground(html, "research", homepage.researchBackgroundImages, homepage.researchOverlayOpacity);
      html = setSectionBackground(html, "projects", homepage.projectsBackgroundImages, homepage.projectsOverlayOpacity);
      html = setSectionBackground(html, "team", homepage.teamBackgroundImages, homepage.teamOverlayOpacity);
      html = setSectionBackground(html, "news", homepage.newsBackgroundImages, homepage.newsOverlayOpacity);
    }

    html = replaceBlock(html, "RESEARCH_CARDS", research.html);
    html = replaceBlock(html, "PROJECT_CARDS", projects.html);
    html = replaceBlock(html, "TEAM_CARDS", team.html);
    html = replaceBlock(html, "NEWS_CARDS", news.html);
    html = replaceBlock(html, "FOOTER_CONTACT", buildFooterContact(settingsDoc?.contact));
    html = replaceBlock(html, "FOOTER_ADDRESSES", buildFooterAddresses(settingsDoc?.contact));
    html = replaceBlock(html, "FOOTER_SOCIALS", buildFooterSocials(settingsDoc?.socialMedia));
    // Partners (name + optional logo) feed the strip when any are published; otherwise the Settings strip items are used.
    const partners = (await Partner.find({ status: "published" }).sort({ order: 1, title: 1 }).select("title image").lean()) as unknown as { title: string; image?: string }[];
    const stripItems = partners.length > 0 ? partners.map((p) => ({ text: p.title, image: p.image })) : homepage?.marqueeItems;
    html = replaceBlock(html, "MARQUEE_ITEMS", buildMarqueeItems(stripItems));
  } catch (error) {
    console.error("Failed to load homepage dynamic content, serving defaults", error);
  }

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
