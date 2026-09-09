import fs from "node:fs";
import path from "node:path";

import { connectToDatabase } from "@/lib/mongodb";
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
};

type CardResult = { html: string | null; count: number };

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

/** Injects a background image (+slideshow if >1 image) and paper-color overlay behind a <section id="..."> element's content. */
function setSectionBackground(html: string, sectionId: string, images: string[] | undefined, opacityPercent: number | undefined): string {
  const list = (images ?? []).filter(Boolean);
  if (list.length === 0) return html;

  const opacity = Math.max(0, Math.min(100, opacityPercent ?? 88)) / 100;
  const layers = `<div class="section-bg-layer" data-bg-images='${escapeHtml(JSON.stringify(list))}' style="background-image:url('${escapeHtml(list[0])}')"></div><div class="section-bg-overlay" style="background:rgba(251,249,246,${opacity})"></div>`;

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

async function buildResearchCards(): Promise<CardResult> {
  const items = await Research.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(4)
    .select("title description slug")
    .lean<{ title: string; description: string; slug: string }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map(
      (item, i) => `
      <a class="rcard" href="/research/${escapeHtml(item.slug)}">
        <div class="num">${String(i + 1).padStart(2, "0")}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(truncate(item.description, 140))}</p>
      </a>`,
    )
    .join("\n");
  return { html, count: items.length };
}

async function buildProjectCards(): Promise<CardResult> {
  const items = await Project.find()
    .sort({ createdAt: -1 })
    .limit(4)
    .select("title description slug")
    .lean<{ title: string; description: string; slug: string }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map(
      (item, i) => `
      <a class="rcard" href="/projects/${escapeHtml(item.slug)}">
        <div class="num">P${i + 1}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(truncate(item.description, 140))}</p>
      </a>`,
    )
    .join("\n");
  return { html, count: items.length };
}

async function buildTeamCards(): Promise<CardResult> {
  const items = await Team.find({ isActive: true })
    .sort({ name: 1 })
    .limit(4)
    .select("name position slug photo scopusData")
    .lean<{ name: string; position: string; slug: string; photo?: string; scopusData?: { hIndex?: number; documentCount?: number } }[]>();

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
      return `
      <a class="tcard" href="/team/${escapeHtml(item.slug)}">
        <div class="tphoto"${photoStyle}></div>
        <h4>${escapeHtml(item.name)}</h4>
        <div class="role">${escapeHtml(item.position)}</div>
        ${metrics}
      </a>`;
    })
    .join("\n");
  return { html, count: items.length };
}

async function buildNewsCards(): Promise<CardResult> {
  const items = await News.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title summary slug category publishedAt")
    .lean<{ title: string; summary: string; slug: string; category: string; publishedAt?: Date }[]>();

  if (items.length === 0) return { html: null, count: 0 };

  const html = items
    .map((item) => {
      const date = item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "";
      return `
      <a class="ncard" href="/news/${escapeHtml(item.slug)}">
        <div class="nthumb"><span class="tag">${escapeHtml(item.category)}</span></div>
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
      SiteSettings.findOne({ key: "global" }).lean<{ homepage?: HomepageSettings }>(),
      buildResearchCards(),
      buildProjectCards(),
      buildTeamCards(),
      buildNewsCards(),
    ]);

    const homepage = settingsDoc?.homepage;
    if (homepage) {
      html = applyHeroSettings(html, homepage);
      html = setSectionBackground(html, "hero-section", homepage.heroBackgroundImages, homepage.heroOverlayOpacity);
      html = setSectionBackground(html, "research", homepage.researchBackgroundImages, homepage.researchOverlayOpacity);
      html = setSectionBackground(html, "projects", homepage.projectsBackgroundImages, homepage.projectsOverlayOpacity);
      html = setSectionBackground(html, "team", homepage.teamBackgroundImages, homepage.teamOverlayOpacity);
      html = setSectionBackground(html, "news", homepage.newsBackgroundImages, homepage.newsOverlayOpacity);
    }

    html = replaceBlock(html, "RESEARCH_CARDS", research.html);
    html = replaceBlock(html, "PROJECT_CARDS", projects.html);
    html = replaceBlock(html, "TEAM_CARDS", team.html);
    html = replaceBlock(html, "NEWS_CARDS", news.html);
  } catch (error) {
    console.error("Failed to load homepage dynamic content, serving defaults", error);
  }

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
