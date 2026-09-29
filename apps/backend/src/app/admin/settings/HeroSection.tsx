"use client";

import { useState } from "react";

import { MultiImageUploadField } from "@/components/MultiImageUploadField";

const DEFAULTS = {
  kicker: "TELKOM UNIVERSITY, CENTER OF EXCELLENCE",
  title: "Learning systems that optimize how research gets done.",
  ctaText: "Explore our research",
  secondaryCtaText: "Book a lab",
  stat1Value: "18+",
  stat1Label: "Active projects",
  stat2Value: "32",
  stat2Label: "Researchers",
  stat3Value: "6",
  stat3Label: "Labs & facilities",
};

type HeroSectionProps = {
  images?: string[];
  opacity?: number;
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

export function HeroSection(props: HeroSectionProps) {
  const [fields, setFields] = useState({
    heroKicker: props.heroKicker ?? "",
    heroTitle: props.heroTitle ?? "",
    heroSubtitle: props.heroSubtitle ?? "",
    ctaText: props.ctaText ?? "",
    secondaryCtaText: props.secondaryCtaText ?? "",
    stat1Value: props.stat1Value ?? "",
    stat1Label: props.stat1Label ?? "",
    stat2Value: props.stat2Value ?? "",
    stat2Label: props.stat2Label ?? "",
    stat3Value: props.stat3Value ?? "",
    stat3Label: props.stat3Label ?? "",
  });
  const [opacity, setOpacity] = useState(props.opacity ?? 88);
  const [images, setImages] = useState(props.images ?? []);

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  return (
    <section id="hero" className="admin2-panel">
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #eeece6" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Homepage hero</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Leave a field empty to keep the default text. The preview updates as you type.</p>
      </div>
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="admin2-field">
            <label htmlFor="kick">Kicker</label>
            <input id="kick" name="heroKicker" type="text" placeholder={DEFAULTS.kicker} value={fields.heroKicker} onChange={(e) => set("heroKicker", e.target.value)} />
          </div>
          <div className="admin2-field">
            <label htmlFor="head">Headline</label>
            <input id="head" name="heroTitle" type="text" placeholder={DEFAULTS.title} value={fields.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
          </div>
          <div className="admin2-field">
            <label htmlFor="sub">Subheading</label>
            <textarea
              id="sub"
              name="heroSubtitle"
              rows={3}
              placeholder="AILO designs and applies AI-driven optimization methods across research, teaching labs, and campus infrastructure…"
              value={fields.heroSubtitle}
              onChange={(e) => set("heroSubtitle", e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <div className="admin2-field">
              <label htmlFor="b1">Primary button</label>
              <input id="b1" name="ctaText" type="text" placeholder={DEFAULTS.ctaText} value={fields.ctaText} onChange={(e) => set("ctaText", e.target.value)} />
              <input aria-label="Primary button link" name="ctaLink" type="text" placeholder="#research" defaultValue={props.ctaLink} style={{ height: 40, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} />
            </div>
            <div className="admin2-field">
              <label htmlFor="b2">Secondary button</label>
              <input id="b2" name="secondaryCtaText" type="text" placeholder={DEFAULTS.secondaryCtaText} value={fields.secondaryCtaText} onChange={(e) => set("secondaryCtaText", e.target.value)} />
              <input aria-label="Secondary button link" name="secondaryCtaLink" type="text" placeholder="#labs" defaultValue={props.secondaryCtaLink} style={{ height: 40, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#5b6664" }}>Stats</span>
          <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr)", gap: 8 }}>
            <input aria-label="Stat 1 value" name="stat1Value" type="text" placeholder={DEFAULTS.stat1Value} value={fields.stat1Value} onChange={(e) => set("stat1Value", e.target.value)} style={{ height: 40 }} />
            <input aria-label="Stat 1 label" name="stat1Label" type="text" placeholder={DEFAULTS.stat1Label} value={fields.stat1Label} onChange={(e) => set("stat1Label", e.target.value)} style={{ height: 40 }} />
            <input aria-label="Stat 2 value" name="stat2Value" type="text" placeholder={DEFAULTS.stat2Value} value={fields.stat2Value} onChange={(e) => set("stat2Value", e.target.value)} style={{ height: 40 }} />
            <input aria-label="Stat 2 label" name="stat2Label" type="text" placeholder={DEFAULTS.stat2Label} value={fields.stat2Label} onChange={(e) => set("stat2Label", e.target.value)} style={{ height: 40 }} />
            <input aria-label="Stat 3 value" name="stat3Value" type="text" placeholder={DEFAULTS.stat3Value} value={fields.stat3Value} onChange={(e) => set("stat3Value", e.target.value)} style={{ height: 40 }} />
            <input aria-label="Stat 3 label" name="stat3Label" type="text" placeholder={DEFAULTS.stat3Label} value={fields.stat3Label} onChange={(e) => set("stat3Label", e.target.value)} style={{ height: 40 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#5b6664" }}>Live preview</span>
          <div style={{ position: "relative", height: 330, borderRadius: 14, overflow: "hidden", background: "#34423f" }}>
            {images[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image preview
              <img src={images[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: `rgba(8, 28, 30, ${opacity / 100})` }} />
            <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: 28, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, color: "#fff" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#f7b77f" }}>{fields.heroKicker || DEFAULTS.kicker}</span>
              <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>{fields.heroTitle || DEFAULTS.title}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#f08a3c", color: "#1e1206", borderRadius: 8, padding: "7px 10px" }}>{fields.ctaText || DEFAULTS.ctaText}</span>
                <span style={{ fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 10px" }}>{fields.secondaryCtaText || DEFAULTS.secondaryCtaText}</span>
              </div>
              <div style={{ display: "flex", gap: 20, paddingTop: 8, fontSize: 11, color: "#d5e6e6" }}>
                <span>
                  <strong style={{ fontSize: 16, color: "#fff" }}>{fields.stat1Value || DEFAULTS.stat1Value}</strong> {fields.stat1Label || DEFAULTS.stat1Label}
                </span>
                <span>
                  <strong style={{ fontSize: 16, color: "#fff" }}>{fields.stat2Value || DEFAULTS.stat2Value}</strong> {fields.stat2Label || DEFAULTS.stat2Label}
                </span>
                <span>
                  <strong style={{ fontSize: 16, color: "#fff" }}>{fields.stat3Value || DEFAULTS.stat3Value}</strong> {fields.stat3Label || DEFAULTS.stat3Label}
                </span>
              </div>
            </div>
          </div>
          <MultiImageUploadField name="heroBackgroundImages" label="Background slides" defaultValues={props.images} onChangeUrls={setImages} />
          <label htmlFor="op" style={{ display: "flex", fontSize: 13, fontWeight: 600, color: "#5b6664" }}>
            Darken image<span style={{ marginLeft: "auto", color: "#15201f" }}>{opacity}%</span>
          </label>
          <input id="op" name="heroOverlayOpacity" type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ accentColor: "#0e6b73", margin: 0 }} />
        </div>
      </div>
    </section>
  );
}
