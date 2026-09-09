import fs from "node:fs";
import path from "node:path";

import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

const homepagePath = path.join(process.cwd(), "public", "homepage.html");

export const dynamic = "force-dynamic";

type HeroSettings = {
  heroBackgroundImage?: string;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function setHeroBackground(html: string, imageUrl: string | undefined): string {
  if (!imageUrl) return html;
  const style = `background-image:linear-gradient(rgba(251,249,246,0.88),rgba(251,249,246,0.88)),url('${escapeHtml(imageUrl)}');background-size:cover;background-position:center;`;
  return html.replace(
    /<section class="hero" id="hero-section">/,
    `<section class="hero" id="hero-section" style="${style}">`,
  );
}

function applyHeroSettings(html: string, hero: HeroSettings): string {
  let out = html;
  out = setHeroBackground(out, hero.heroBackgroundImage);
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

export async function GET() {
  let html = fs.readFileSync(homepagePath, "utf-8");

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "global" }).lean<{ homepage?: HeroSettings }>();
    if (settings?.homepage) {
      html = applyHeroSettings(html, settings.homepage);
    }
  } catch (error) {
    console.error("Failed to load homepage hero settings, serving defaults", error);
  }

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
