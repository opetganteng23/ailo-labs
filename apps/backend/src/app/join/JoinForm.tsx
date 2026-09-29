"use client";

import Link from "next/link";
import { useState } from "react";

import { MemberCardFront } from "@/components/MemberCardFront";

const CATEGORY_DEFS = [
  { name: "Peneliti Mahasiswa", hint: "S1, S2 or S3 student doing research with AILO" },
  { name: "Peneliti", hint: "Researcher or research staff" },
  { name: "Dosen", hint: "Lecturer at Telkom University or a partner campus" },
  { name: "Peneliti Alumni", hint: "Graduate who researched with AILO" },
] as const;

const RESEARCH_INTERESTS = ["NLP & RAG", "Optimization & RL", "Computer Vision", "Applied ML & Smart Campus"];

const STEP_NAMES = ["Account", "Affiliation", "Proof & profiles", "Review"];

type FormState = {
  photo: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  categoryIndex: number;
  studyLevel: string;
  institution: string;
  studyProgram: string;
  nim: string;
  entryYear: string;
  researchInterests: string[];
  proofDocument: string;
  linkedin: string;
  orcid: string;
  googleScholar: string;
  sinta: string;
  scopus: string;
  motivation: string;
  agreeTerms: boolean;
  showProfilePublicly: boolean;
};

const INITIAL_STATE: FormState = {
  photo: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
  categoryIndex: 0,
  studyLevel: "S1",
  institution: "Telkom University",
  studyProgram: "",
  nim: "",
  entryYear: "",
  researchInterests: [],
  proofDocument: "",
  linkedin: "",
  orcid: "",
  googleScholar: "",
  sinta: "",
  scopus: "",
  motivation: "",
  agreeTerms: false,
  showProfilePublicly: false,
};

export function JoinForm() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState<"" | "photo" | "proofDocument">("");
  const [uploadError, setUploadError] = useState("");
  const [proofName, setProofName] = useState("");

  async function upload(key: "photo" | "proofDocument", file: File | undefined) {
    if (!file) return;
    setUploading(key);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/members/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setUploadError(json.error ?? "Upload failed, try again.");
      } else {
        set(key, json.data.url);
        if (key === "proofDocument") setProofName(file.name);
      }
    } catch {
      setUploadError("Upload failed, try again.");
    }
    setUploading("");
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  const isStudent = state.categoryIndex === 0;
  const categoryLabel = CATEGORY_DEFS[state.categoryIndex].name + (isStudent ? ` · ${state.studyLevel}` : "");
  const affiliation = [
    state.institution,
    state.studyProgram,
    state.nim && `NIM/NIP ${state.nim}`,
    state.entryYear && `Angkatan ${state.entryYear}`,
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleInterest(interest: string) {
    setState((s) => ({
      ...s,
      researchInterests: s.researchInterests.includes(interest)
        ? s.researchInterests.filter((i) => i !== interest)
        : [...s.researchInterests, interest],
    }));
  }

  function canContinue(): boolean {
    if (step === 1)
      return !!(state.photo && state.name.trim() && state.email.trim() && state.password.length >= 8 && state.password === state.passwordConfirm);
    if (step === 3) return !!state.proofDocument;
    if (step === 4) return state.agreeTerms;
    return true;
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          phone: state.phone || undefined,
          password: state.password,
          affiliation: affiliation || state.institution,
          requestedAs: CATEGORY_DEFS[state.categoryIndex].name,
          photo: state.photo,
          proofDocument: state.proofDocument,
          studyLevel: isStudent ? state.studyLevel : undefined,
          researchInterests: state.researchInterests,
          motivation: state.motivation || undefined,
          showProfilePublicly: state.showProfilePublicly,
          profiles: {
            linkedin: state.linkedin || undefined,
            orcid: state.orcid || undefined,
            googleScholar: state.googleScholar || undefined,
            sinta: state.sinta || undefined,
            scopus: state.scopus || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Unable to submit application.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error, please try again.");
      setSubmitting(false);
    }
  }

  function next() {
    if (step === 4) {
      submit();
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  if (done) {
    return (
      <section className="join-panel" style={{ maxWidth: 680 }}>
        <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <span style={{ width: 72, height: 72, borderRadius: 999, background: "#dcf1e4", color: "#17603a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Registration received</h2>
          <p style={{ margin: 0, maxWidth: 480, fontSize: 16, lineHeight: 1.6, color: "#4e5957" }}>
            We&apos;ve emailed a confirmation to {state.email}. Our team will review your request and let you know the result by email.
          </p>
          <ol style={{ margin: "12px 0 0", padding: 0, listStyle: "none", width: "100%", maxWidth: 520, textAlign: "left" }}>
            <li style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #eeece6" }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: "#0e6b73", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Submitted</span>
                <span style={{ fontSize: 14, color: "#6b7573" }}>Just now</span>
              </span>
            </li>
            <li style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #eeece6" }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, boxSizing: "border-box", borderRadius: 999, border: "2.5px solid #f08a3c" }} />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Verification by AILO team</span>
                <span style={{ fontSize: 14, color: "#6b7573" }}>In progress</span>
              </span>
            </li>
            <li style={{ display: "flex", gap: 14, padding: "14px 0" }}>
              <span style={{ width: 26, height: 26, flexShrink: 0, boxSizing: "border-box", borderRadius: 999, border: "2px solid #c9c6bd" }} />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Digital member card sent</span>
                <span style={{ fontSize: 14, color: "#6b7573" }}>To your email, after approval</span>
              </span>
            </li>
          </ol>
          <Link href="/" className="join-btn join-btn-dark" style={{ marginTop: 12 }}>
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="join-grid">
    <section className="join-panel">
      <ol aria-label="Registration steps" className="join-steps-indicator">
        {STEP_NAMES.map((name, i) => {
          const k = i + 1;
          const isDone = k < step;
          const isCurrent = k === step;
          return (
            <li key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="step-dot"
                style={{
                  background: isDone ? "#0e6b73" : isCurrent ? "#0a3f46" : "transparent",
                  color: isDone || isCurrent ? "#fff" : "#6b7573",
                  border: isDone || isCurrent ? "none" : "2px solid #d5d1c6",
                }}
              >
                {isDone ? "✓" : k}
              </span>
              <span style={{ fontSize: 14, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#15201f" : isDone ? "#0e6b73" : "#6b7573" }}>{name}</span>
            </li>
          );
        })}
      </ol>

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {step === 1 && (
          <>
            <div>
              <h2 className="join-step-title">Your account</h2>
              <p className="join-step-sub">You&apos;ll use this email to sign in and receive your member card.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, padding: 16, borderRadius: 14, background: "#f7f5f0" }}>
              <label htmlFor="jphoto" className="join-photo-pick" aria-label="Upload photo">
                {state.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- previewing the visitor's own upload
                  <img src={state.photo} alt="Your photo" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                )}
                <input id="jphoto" type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={(e) => upload("photo", e.target.files?.[0])} />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Photo for your member card</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#5b6664" }}>
                  {uploading === "photo" ? "Uploading…" : "Portrait, plain background, face clearly visible. JPG or PNG."}
                </span>
                {uploadError && <span className="error-text">{uploadError}</span>}
              </div>
            </div>
            <div className="join-field">
              <label htmlFor="jname">
                Full name <span style={{ fontWeight: 500, color: "#6b7573" }}>— as printed on your card, with titles</span>
              </label>
              <input id="jname" type="text" placeholder="e.g. Nama Lengkap, S.Kom." value={state.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="join-field">
                <label htmlFor="jemail">Email</label>
                <input id="jemail" type="email" placeholder="nama@student.telkomuniversity.ac.id" value={state.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="join-field">
                <label htmlFor="jwa">
                  WhatsApp <span style={{ fontWeight: 500, color: "#6b7573" }}>(optional)</span>
                </label>
                <input id="jwa" type="tel" placeholder="+62 8…" value={state.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="join-field">
                <label htmlFor="jpw">Password</label>
                <input id="jpw" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={state.password} onChange={(e) => set("password", e.target.value)} />
              </div>
              <div className="join-field">
                <label htmlFor="jpw2">Confirm password</label>
                <input id="jpw2" type="password" autoComplete="new-password" value={state.passwordConfirm} onChange={(e) => set("passwordConfirm", e.target.value)} />
                {state.passwordConfirm && state.password !== state.passwordConfirm && <span className="error-text">Passwords don&apos;t match.</span>}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="join-step-title">Category &amp; affiliation</h2>
              <p className="join-step-sub">Pick the one that fits you today. Our team can adjust it during review.</p>
            </div>
            <div role="radiogroup" aria-label="Member category" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {CATEGORY_DEFS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={state.categoryIndex === i}
                  className={`join-category${state.categoryIndex === i ? " active" : ""}`}
                  onClick={() => set("categoryIndex", i)}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#15201f" }}>{c.name}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.45, color: "#5b6664" }}>{c.hint}</span>
                </button>
              ))}
            </div>
            {isStudent && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 14, background: "#f2f8f8", border: "1px solid #d7e7e7" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Study level</span>
                <div style={{ display: "flex", padding: 4, background: "#fff", border: "1px solid #dad7cf", borderRadius: 10, gap: 2 }}>
                  {["S1", "S2", "S3"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set("studyLevel", l)}
                      style={{
                        width: 56,
                        height: 36,
                        border: 0,
                        borderRadius: 7,
                        fontSize: 14,
                        cursor: "pointer",
                        background: state.studyLevel === l ? "#0e6b73" : "transparent",
                        color: state.studyLevel === l ? "#fff" : "#3b4947",
                        fontWeight: state.studyLevel === l ? 800 : 600,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="join-field">
                <label htmlFor="jinst">Institution</label>
                <input id="jinst" type="text" value={state.institution} onChange={(e) => set("institution", e.target.value)} />
              </div>
              <div className="join-field">
                <label htmlFor="jprog">Study program / unit</label>
                <input id="jprog" type="text" placeholder="e.g. S2 Informatika" value={state.studyProgram} onChange={(e) => set("studyProgram", e.target.value)} />
              </div>
              <div className="join-field">
                <label htmlFor="jnim">NIM / NIP / NIDN</label>
                <input id="jnim" type="text" value={state.nim} onChange={(e) => set("nim", e.target.value)} />
              </div>
              <div className="join-field">
                <label htmlFor="jyear">
                  Entry year <span style={{ fontWeight: 500, color: "#6b7573" }}>(graduation year for alumni)</span>
                </label>
                <input id="jyear" type="text" placeholder="2025" value={state.entryYear} onChange={(e) => set("entryYear", e.target.value)} />
              </div>
            </div>
            <div className="join-field">
              <label>Research interests</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {RESEARCH_INTERESTS.map((interest) => {
                  const checked = state.researchInterests.includes(interest);
                  return (
                    <label key={interest} className={`join-interest${checked ? " active" : ""}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleInterest(interest)} style={{ width: 16, height: 16, accentColor: "#0e6b73" }} />
                      {interest}
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="join-step-title">Proof &amp; academic profiles</h2>
              <p className="join-step-sub">Only the proof document is required. Profiles help us feature your work.</p>
            </div>
            <div className="join-field">
              <label>
                Proof of affiliation <span style={{ color: "#b4530f" }}>*</span>
              </label>
              <label htmlFor="jproof" className="join-proof-pick">
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {uploading === "proofDocument" ? "Uploading…" : proofName || "Upload KTM, surat tugas, or ijazah"}
                </span>
                <span style={{ fontSize: 13, color: "#6b7573" }}>{proofName ? "Uploaded · click to replace" : "PDF, JPG or PNG · max 5 MB"}</span>
                <input id="jproof" type="file" accept="image/png,image/jpeg,application/pdf" style={{ display: "none" }} onChange={(e) => upload("proofDocument", e.target.files?.[0])} />
              </label>
              {uploadError && <span className="error-text">{uploadError}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", gap: "10px 14px", alignItems: "center" }}>
              <label htmlFor="jli" style={{ fontSize: 14, fontWeight: 700 }}>
                LinkedIn
              </label>
              <input id="jli" type="url" placeholder="linkedin.com/in/…" value={state.linkedin} onChange={(e) => set("linkedin", e.target.value)} style={{ height: 46 }} />
              <label htmlFor="jor" style={{ fontSize: 14, fontWeight: 700 }}>
                ORCID
              </label>
              <input id="jor" type="text" placeholder="0000-0000-0000-0000" value={state.orcid} onChange={(e) => set("orcid", e.target.value)} style={{ height: 46 }} />
              <label htmlFor="jgs" style={{ fontSize: 14, fontWeight: 700 }}>
                Google Scholar
              </label>
              <input id="jgs" type="url" placeholder="scholar.google.com/citations?user=…" value={state.googleScholar} onChange={(e) => set("googleScholar", e.target.value)} style={{ height: 46 }} />
              <label htmlFor="jsi" style={{ fontSize: 14, fontWeight: 700 }}>
                SINTA
              </label>
              <input id="jsi" type="text" placeholder="SINTA ID or profile URL" value={state.sinta} onChange={(e) => set("sinta", e.target.value)} style={{ height: 46 }} />
              <label htmlFor="jsc" style={{ fontSize: 14, fontWeight: 700 }}>
                Scopus
              </label>
              <input id="jsc" type="text" placeholder="Scopus Author ID or URL" value={state.scopus} onChange={(e) => set("scopus", e.target.value)} style={{ height: 46 }} />
            </div>
            <div className="join-field">
              <label htmlFor="jmot">
                Why do you want to join? <span style={{ fontWeight: 500, color: "#6b7573" }}>(optional)</span>
              </label>
              <textarea id="jmot" rows={3} value={state.motivation} onChange={(e) => set("motivation", e.target.value)} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h2 className="join-step-title">Review &amp; submit</h2>
              <p className="join-step-sub">Check your details. You can&apos;t edit them while your request is under review.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "200px minmax(0, 1fr)", gap: "14px 16px", padding: 22, borderRadius: 14, background: "#f7f5f0", fontSize: 15 }}>
              <span style={{ color: "#6b7573" }}>Name</span>
              <span style={{ fontWeight: 700 }}>{state.name || "—"}</span>
              <span style={{ color: "#6b7573" }}>Email</span>
              <span style={{ fontWeight: 700 }}>{state.email || "—"}</span>
              <span style={{ color: "#6b7573" }}>Category</span>
              <span style={{ fontWeight: 700 }}>{categoryLabel}</span>
              <span style={{ color: "#6b7573" }}>Affiliation</span>
              <span style={{ fontWeight: 700 }}>{affiliation || state.institution}</span>
              <span style={{ color: "#6b7573" }}>Proof document</span>
              <span style={{ fontWeight: 700 }}>{state.proofDocument ? "Uploaded" : "Not uploaded"}</span>
            </div>
            {error && <p className="error-text">{error}</p>}
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, lineHeight: 1.5 }}>
              <input type="checkbox" checked={state.agreeTerms} onChange={(e) => set("agreeTerms", e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, accentColor: "#0e6b73" }} />I
              confirm the information above is accurate and agree to AILO&apos;s member terms and privacy policy.
            </label>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={state.showProfilePublicly}
                onChange={(e) => set("showProfilePublicly", e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: "#0e6b73" }}
              />
              Show my name and profile links on the AILO website once approved (optional).
            </label>
          </>
        )}
      </div>

      <div style={{ padding: "18px 32px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #eeece6", background: "#fbfaf7" }}>
        <span style={{ fontSize: 14, color: "#6b7573" }}>Step {step} of 4</span>
        {step > 1 && (
          <button type="button" className="join-btn join-btn-outline" style={{ marginLeft: "auto" }} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Back
          </button>
        )}
        <button
          type="button"
          className={step === 4 ? "join-btn join-btn-orange" : "join-btn join-btn-dark"}
          style={step === 1 ? { marginLeft: "auto" } : undefined}
          onClick={next}
          disabled={!canContinue() || submitting}
        >
          {step === 4 ? (submitting ? "Submitting…" : "Submit registration") : "Continue"}
        </button>
      </div>
    </section>

    <aside className="join-aside">
      <div className="join-aside-card">
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#6b7573" }}>YOUR CARD PREVIEW</span>
        <div className="join-card-preview">
          <MemberCardFront
            name={state.name || "Nama Kamu"}
            category={categoryLabel}
            affiliation={state.studyProgram ? `${state.studyProgram} · ${state.institution}` : "[Program studi / institusi]"}
            photo={state.photo || undefined}
            cardId="AILO-2026-0001"
            validUntil="[Tanggal berlaku]"
            qrSrc="/member-card-qr-sample.svg"
          />
        </div>
        <span style={{ fontSize: 13, lineHeight: 1.5, color: "#6b7573" }}>Member ID and validity are assigned when your request is approved.</span>
      </div>
      <div className="join-aside-benefits">
        <span style={{ fontSize: 16, fontWeight: 800 }}>What members get</span>
        <ul>
          <li>A digital member card, verifiable by QR</li>
          <li>An optional profile on the AILO team page</li>
          <li>Priority booking for AILO labs and devices</li>
        </ul>
      </div>
      <p style={{ margin: 0, padding: "0 8px", fontSize: 14, lineHeight: 1.5, color: "#5b6664" }}>
        Questions? Email <a href="mailto:ailo@telkomuniversity.ac.id" style={{ fontWeight: 700, color: "#0e6b73", textDecoration: "underline" }}>ailo@telkomuniversity.ac.id</a>
      </p>
    </aside>
    </div>
  );
}
