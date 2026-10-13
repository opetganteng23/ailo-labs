import type { Metadata } from "next";
import Link from "next/link";

import { RichContent } from "@/components/RichContent";
import { SiteFooter } from "@/components/SiteFooter";

import { looksLikePlainText, plainTextToParagraphs, renderRichText } from "@/lib/sanitizeHtml";

import { BackgroundLayer } from "./home/BackgroundLayer";
import { BooksWidget } from "./home/BooksWidget";
import { ChatWidget } from "./home/ChatWidget";
import { getHomeData, type HomeData, type LabRow, type ProjectCard, type ResearchCard } from "./home/data";
import { HomeHeader } from "./home/HomeHeader";
import { Marquee } from "./home/Marquee";
import { NewsSlider } from "./home/NewsSlider";
import { TeamGrid } from "./home/TeamGrid";
import { bgSectionStyle, hm, truncate } from "./home/util";

import "./home/home.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AILO, AI Learning For Optimization | Telkom University",
  description: "AI Learning For Optimization - Telkom University Center of Excellence.",
};

function ResearchIcon({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <>
          <path d="M4 5h16v11H8l-4 4z" />
          <path d="M8 9h8M8 12h5" />
        </>
      );
    case 1:
      return (
        <>
          <path d="M3 17l5-5 4 4 8-9" />
          <path d="M14 7h6v6" />
        </>
      );
    case 2:
      return (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    default:
      return <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />;
  }
}

const SAMPLE_RESEARCH: ResearchCard[] = [
  { title: "Optimization & Reinforcement Learning", description: "Decision-making algorithms for resource allocation, scheduling, and control under uncertainty.", slug: "" },
  { title: "Natural Language Processing", description: "Retrieval-augmented generation, information extraction, and Bahasa Indonesia language models.", slug: "" },
  { title: "Computer Vision", description: "Real-time detection and monitoring systems tuned to run on edge and embedded hardware.", slug: "" },
  { title: "Applied ML for Smart Campus", description: "Models that optimize energy, mobility, and facility use across the Telkom University campus.", slug: "" },
];
// Icon order matches the original template: sample cards used these four glyphs in this order.
const SAMPLE_ICON_ORDER = [1, 0, 2, 3];

const SAMPLE_PROJECTS: ProjectCard[] = [
  { title: "Campus Lab Scheduling Optimizer", description: "A reinforcement-learning scheduler that cuts booking conflicts across shared research facilities.", slug: "", status: "ongoing" },
  { title: "Bahasa Indonesia RAG Assistant", description: "Retrieval-augmented chatbot infrastructure for public information access, built with partner institutions.", slug: "", status: "planned" },
];

const SAMPLE_LABS: LabRow[] = [
  { name: "Deep Learning Lab", meta: "4x GPU node · 12 workstations", status: "open" },
  { name: "Computer Vision Lab", meta: "Camera rigs · edge devices", status: "open" },
  { name: "Optimization & Robotics Lab", meta: "Sim rigs · control hardware", status: "busy" },
  { name: "NLP & Data Lab", meta: "Annotation stations · servers", status: "open" },
];

const PROJECT_STATUS_LABEL: Record<string, string> = { planned: "Planned", ongoing: "Ongoing", completed: "Completed" };
const PROJECT_STATUS_CLASS: Record<string, string> = { planned: "status-planned", ongoing: "status-ongoing", completed: "status-completed" };

function SectionHead({ kicker, title, desc, linkHref, linkLabel }: { kicker: string; title: string; desc: string; linkHref: string; linkLabel: string }) {
  return (
    <div className={hm("sec-head")}>
      <div>
        <span className={hm("kicker-sm")}>{kicker}</span>
        <h2>{title}</h2>
      </div>
      <div className={hm("sec-desc")}>
        <p>{desc}</p>
        <a href={linkHref} className={hm("sec-link")}>
          {linkLabel}
        </a>
      </div>
    </div>
  );
}

const ABOUT_DEFAULT_TITLE = "A Telkom University Center of Excellence for applied AI.";
const ABOUT_DEFAULT_BODY = `AILO (AI Learning For Optimization) is a Center of Excellence under Telkom University, Bandung. We design and apply AI-driven optimization methods across research, teaching labs, and campus infrastructure, turning open questions into working systems.

Our researchers, lecturers and students work across four tracks: optimization and reinforcement learning, natural language processing, computer vision, and applied machine learning for the smart campus. Labs and equipment are open for booking, and the AILO chatbot answers questions from our own published content.`;

function AboutSection({ about, stats }: { about?: HomeData["about"]; stats: string[] }) {
  const rawBody = about?.body?.trim() || ABOUT_DEFAULT_BODY;
  // Settings used to store this as plain text (blank line = new paragraph) before it got a rich text
  // editor; anything saved that way still has no markup, so it's upgraded to <p> tags before rendering.
  const bodyHtml = renderRichText(looksLikePlainText(rawBody) ? plainTextToParagraphs(rawBody) : rawBody);
  const defaults = [
    { href: "/research", title: "Research Development", text: "Four research tracks that turn open questions into deployable systems." },
    { href: "/partners", title: "Institutional Development", text: "Strengthening governance, partnerships and AI readiness across the university." },
    { href: "/team", title: "Academic Excellence", text: "Lecturers, researchers and students advancing applied AI expertise." },
    { href: "/services", title: "Commercialization and Implementation", text: "Turning research into services, products and real-world impact." },
  ];
  const custom = (about?.pillars ?? []).filter((p) => p.title?.trim() || p.text?.trim());
  const pillars = custom.length > 0 ? custom.map((p, i) => ({ href: p.href?.trim() || defaults[i]?.href || "/", title: p.title?.trim() ?? "", text: p.text?.trim() ?? "" })) : defaults;
  return (
    <section id="about">
      <div className={hm("wrap")}>
        <div className={hm("about-grid")}>
          <div className={hm("about-copy")}>
            <span className={hm("kicker-sm")}>{about?.kicker?.trim() || "ABOUT AILO"}</span>
            <h2>{about?.title?.trim() || ABOUT_DEFAULT_TITLE}</h2>
            <RichContent html={bodyHtml} />
            <div className={hm("about-stats")}>
              {["Active projects", "Researchers", "Labs & facilities"].map((label, i) => (
                <div key={label}>
                  <b>{stats[i]}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          {about?.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded photo
            <img className={hm("about-photo")} src={about.image} alt="AILO" />
          ) : (
            <div className={hm("about-pillars")}>
              {pillars.map((x) => (
                <Link key={x.title} href={x.href} className={hm("about-pillar")}>
                  <b>{x.title}</b>
                  <span>{x.text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const data = await getHomeData();
  const hp = data.homepage;
  const research = data.research.length > 0 ? data.research : SAMPLE_RESEARCH;
  const researchIcons = data.research.length > 0 ? research.map((_, i) => i % 4) : SAMPLE_ICON_ORDER;
  const projects = data.projects.length > 0 ? data.projects : SAMPLE_PROJECTS;
  const labs = data.labs.length > 0 ? data.labs : SAMPLE_LABS;

  return (
    <div className={hm("root")} id="top">
      <section className={hm("hero")} id="hero-section" style={bgSectionStyle(hp?.heroBackgroundImages)}>
        <BackgroundLayer images={hp?.heroBackgroundImages} opacityPercent={hp?.heroOverlayOpacity} tone="dark" />
        <div className={hm("hero-scrim")} />
        <HomeHeader />

        <div className={hm("hero-copy")}>
          <div className={hm("kicker")}>
            <span className={hm("dash")} />
            <span id="hero-kicker">{hp?.heroKicker || "TELKOM UNIVERSITY · CENTER OF EXCELLENCE"}</span>
          </div>
          <h1 id="hero-title">
            {hp?.heroTitle ? (
              hp.heroTitle
            ) : (
              <>
                Learning systems that <em>optimize</em> how research gets done.
              </>
            )}
          </h1>
          <p className={hm("lede")} id="hero-lede">
            {hp?.heroSubtitle || "AILO designs and applies AI-driven optimization methods across research, teaching labs, and campus infrastructure, turning open questions into working systems."}
          </p>
          <div className={hm("hero-actions")}>
            <a href={hp?.ctaLink || "#research"} className={hm("btn btn-primary")} id="hero-cta-primary">
              {hp?.ctaText || "Explore our research"}
            </a>
            <a href={hp?.secondaryCtaLink || "/labs"} className={hm("btn btn-outline-light")} id="hero-cta-secondary">
              {hp?.secondaryCtaText || "Book a lab"}
            </a>
          </div>
        </div>

        <div className={hm("hero-stats")}>
          <div className={hm("stat")}>
            <span className={hm("n")} id="hero-stat-1-value">{hp?.stat1Value || "18+"}</span>
            <span className={hm("l")} id="hero-stat-1-label">{hp?.stat1Label || "Active projects"}</span>
          </div>
          <div className={hm("stat")}>
            <span className={hm("n")} id="hero-stat-2-value">{hp?.stat2Value || "32"}</span>
            <span className={hm("l")} id="hero-stat-2-label">{hp?.stat2Label || "Researchers"}</span>
          </div>
          <div className={hm("stat")}>
            <span className={hm("n")} id="hero-stat-3-value">{hp?.stat3Value || "6"}</span>
            <span className={hm("l")} id="hero-stat-3-label">{hp?.stat3Label || "Labs & facilities"}</span>
          </div>
          <div className={hm("hero-dots")} aria-label="Hero slides">
            <span className={hm("on")} />
            <span />
            <span />
          </div>
        </div>
      </section>

      {data.strip !== null && <Marquee items={data.strip} />}

      <AboutSection about={data.about} stats={[hp?.stat1Value || "18+", hp?.stat2Value || "32", hp?.stat3Value || "6"]} />

      <section id="news" style={bgSectionStyle(hp?.newsBackgroundImages)}>
        <BackgroundLayer images={hp?.newsBackgroundImages} opacityPercent={hp?.newsOverlayOpacity} />
        <div className={hm("wrap")}>
          <SectionHead
            kicker="NEWS"
            title="Latest from the lab."
            desc="Research updates, publications, and lab announcements, drafted with AI and reviewed by our team before they go live."
            linkHref="/news"
            linkLabel="Browse all news"
          />
          <NewsSlider items={data.news} />
        </div>
      </section>

      <section id="research" style={bgSectionStyle(hp?.researchBackgroundImages)}>
        <BackgroundLayer images={hp?.researchBackgroundImages} opacityPercent={hp?.researchOverlayOpacity} />
        <div className={hm("wrap")}>
          <SectionHead
            kicker="RESEARCH"
            title="Four research areas, one lab."
            desc="Each track pairs theory with a deployable system, built, tested, and iterated on inside AILO's own labs."
            linkHref="/research"
            linkLabel="View all research areas"
          />
          <div className={hm("research-grid")} id="research-grid">
            {research.map((item, i) => (
              <a key={`${item.slug}-${i}`} className={hm("rcard")} href={item.slug ? `/research/${item.slug}` : "/research"}>
                <div className={hm("rcard-top")}>
                  <span className={hm("num")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={hm("ricon")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <ResearchIcon index={researchIcons[i]} />
                    </svg>
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{truncate(item.description, 110)}</p>
                <span className={hm("explore")}>Explore</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" style={bgSectionStyle(hp?.projectsBackgroundImages)}>
        <BackgroundLayer images={hp?.projectsBackgroundImages} opacityPercent={hp?.projectsOverlayOpacity} />
        <div className={hm("wrap")}>
          <SectionHead
            kicker="PROJECTS"
            title="18+ projects, from research to production."
            desc="Ongoing collaborations and applied builds that carry our research areas into deployable systems."
            linkHref="/projects"
            linkLabel="View all projects"
          />
          <div className={hm("projects-grid")} id="projects-grid">
            {projects.map((item, i) => (
              <Link key={`${item.slug}-${i}`} className={hm("pcard")} href={item.slug ? `/projects/${item.slug}` : "/projects"}>
                <div className={hm("pcard-thumb")} style={item.image ? { backgroundImage: `url('${item.image}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                <div className={hm("pcard-body")}>
                  <div className={hm("pcard-meta")}>
                    <span className={hm("num")}>P{i + 1}</span>
                    <span className={hm(`pstatus ${PROJECT_STATUS_CLASS[item.status] ?? "status-planned"}`)}>{PROJECT_STATUS_LABEL[item.status] ?? item.status}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{truncate(item.description, 110)}</p>
                </div>
              </Link>
            ))}
            <Link className={hm("pcard-stat")} href="/projects">
              <div className={hm("ring")} />
              <span className={hm("big")}>18+</span>
              <span className={hm("txt")}>active projects across four research tracks</span>
              <span className={hm("more")}>See all projects</span>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className={hm("wrap feature")}>
          <div className={hm("chat-mock")}>
            <div className={hm("chead")}>
              <span className={hm("icon")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4" />
                </svg>
              </span>
              <div className={hm("titles")}>
                <b>Ask AILO</b>
                <span className={hm("status")}>
                  <span className={hm("pulse")} />
                  Online · answers from AILO&apos;s own pages
                </span>
              </div>
            </div>
            <div className={hm("cbody")}>
              <div className={hm("bubble bot")}>Halo! Saya asisten AILO. Ada yang bisa saya bantu seputar riset, proyek, atau peminjaman lab?</div>
              <div className={hm("bubble user")}>Lab mana yang punya GPU cluster untuk training model?</div>
              <div className={hm("bubble bot")}>Deep Learning Lab (Lab 3) punya 4x GPU node yang bisa dipinjam. Mau saya bantu buka form peminjamannya?</div>
              <div className={hm("typing")}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={hm("cfoot")}>
              <input type="text" placeholder="Tanyakan sesuatu tentang AILO..." disabled />
              <button type="button">Send</button>
            </div>
          </div>
          <div className={hm("feature-text")}>
            <div className={hm("eyebrow")}>AI ASSISTANT</div>
            <h2>An AI chatbot that actually knows AILO.</h2>
            <p>Built on retrieval over our own research, projects, and lab pages, so every answer is grounded in what AILO has actually published, not a guess.</p>
            <ul className={hm("flist")}>
              {[
                "Answers grounded in AILO's own content, refreshed automatically",
                "Available on every page, no sign-in required",
                "Steers back to AILO topics when a question falls outside scope",
              ].map((line) => (
                <li key={line}>
                  <span className={hm("fi")}>
                    <svg viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="labs" className={hm("band")}>
        <div className={hm("wrap")}>
          <div>
            <div className={hm("eyebrow")}>LABS &amp; EQUIPMENT</div>
            <h2>Reserve a lab or device in minutes.</h2>
            <p>Every AILO lab and its equipment is listed with live availability. Submit a request and get a confirmation by email, no account needed.</p>
            <div className={hm("band-actions")}>
              <Link href="/labs" className={hm("btn btn-primary")}>
                Ajukan peminjaman
              </Link>
              <Link href="/labs" className={hm("btn btn-outline-light")}>
                See all labs
              </Link>
            </div>
          </div>
          <div className={hm("lab-list")}>
            {labs.map((lab) => (
              <Link key={lab.name} className={hm("lab-row")} href="/labs">
                <span style={{ flexGrow: 1 }}>
                  <span className={hm("name")}>{lab.name}</span>
                  <div className={hm("meta")}>{lab.meta}</div>
                </span>
                <span className={hm(`status ${lab.status}`)}>{lab.status === "open" ? "Available" : "Booked today"}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="team" style={bgSectionStyle(hp?.teamBackgroundImages)}>
        <BackgroundLayer images={hp?.teamBackgroundImages} opacityPercent={hp?.teamOverlayOpacity} />
        <div className={hm("wrap")}>
          <SectionHead
            kicker="PEOPLE"
            title="People behind AILO."
            desc="Faculty, researchers, and students across our four research tracks, with publication data pulled from Scopus."
            linkHref="/team"
            linkLabel="View full team"
          />
          <TeamGrid items={data.team} categories={data.teamCategories} />
        </div>
      </section>

      <section id="join" className={hm("join-sec")}>
        <div className={hm("wrap")}>
          <div className={hm("join-copy")}>
            <span className={hm("eyebrow")}>MEMBERSHIP</span>
            <h2>Join the AILO research network.</h2>
            <p>Students, researchers, lecturers and alumni can register as AILO members. Once our team verifies you, your digital member card arrives by email.</p>
            <div className={hm("join-chips")}>
              {["Peneliti Mahasiswa S1 · S2 · S3", "Peneliti", "Dosen", "Peneliti Alumni"].map((chip) => (
                <span key={chip} className={hm("join-chip")}>
                  {chip}
                </span>
              ))}
            </div>
            <ol className={hm("join-steps")}>
              <li>
                <span className={hm("step-n")}>STEP 1</span>
                <span className={hm("step-t")}>Register online</span>
                <span className={hm("step-d")}>Your details, affiliation and proof document.</span>
              </li>
              <li>
                <span className={hm("step-n")}>STEP 2</span>
                <span className={hm("step-t")}>We verify you</span>
                <span className={hm("step-d")}>An admin or staff member reviews your request.</span>
              </li>
              <li>
                <span className={hm("step-n")}>STEP 3</span>
                <span className={hm("step-t")}>Get your card</span>
                <span className={hm("step-d")}>A digital member card with a QR you can verify.</span>
              </li>
            </ol>
            <div className={hm("join-actions")}>
              <a href="/join" className={hm("btn btn-solid-dark")}>
                Register as member
              </a>
            </div>
          </div>
          <div className={hm("join-visual")}>
            <div className={hm("card-shadow")} />
            <div className={hm("card-tilt")}>
              <div className={hm("mcard")}>
                <div className={hm("ring")} />
                <div className={hm("stripe")} />
                <div className={hm("top")}>
                  <span className={hm("logo")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static decorative sample card */}
                    <img src="/logo-square.png" alt="AILO" />
                  </span>
                  <span className={hm("org")}>
                    <b>CoE AILO</b>
                    <span>Telkom University</span>
                  </span>
                  <span className={hm("badge")}>MEMBER</span>
                </div>
                <div className={hm("mid")}>
                  <div className={hm("photo")}>Photo</div>
                  <div className={hm("who")}>
                    <span className={hm("holder")}>Nama Kamu</span>
                    <span className={hm("cat")}>Peneliti Mahasiswa · S2</span>
                    <span className={hm("aff")}>[Program studi / institusi]</span>
                  </div>
                </div>
                <div className={hm("bot")}>
                  <div className={hm("f")}>
                    <small>MEMBER ID</small>
                    <b className={hm("mono")}>AILO-2026-0001</b>
                  </div>
                  <div className={hm("f")}>
                    <small>VALID UNTIL</small>
                    <b>[Tanggal berlaku]</b>
                  </div>
                  <div className={hm("qr")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static decorative sample card */}
                    <img src="/member-card-qr-sample.svg" alt="Verification QR code" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={hm("cta-sec")}>
        <div className={hm("wrap")}>
          <h2>Working on something AILO could help with?</h2>
          <p>Whether it&apos;s a research collaboration, a lab booking, or a question for our chatbot, here&apos;s where to start.</p>
          <div className={hm("cta-actions")}>
            <a href="/contact" className={hm("btn btn-primary")}>
              Get in touch
            </a>
            <a href="#projects" className={hm("btn btn-outline-dark")}>
              See our projects
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
      <BooksWidget books={data.books} />
      <ChatWidget />
    </div>
  );
}
