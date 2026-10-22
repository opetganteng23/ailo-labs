"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { saveModelSettingsAction } from "./actions";

const CHAT_MODEL_PLACEHOLDER: Record<string, string> = {
  openai: "e.g. gpt-4o-mini",
  anthropic: "e.g. claude-haiku-5-5",
  gemini: "e.g. gemini-2.0-flash",
  custom: "model name",
};

// The model id the API actually expects (e.g. "claude-sonnet-5-5"), not the display name shown
// on claude.ai (e.g. "Claude Sonnet 5.5") - typing the display name here is a dead end the API
// rejects, so Anthropic gets a dropdown of real ids instead of a free-text field to get wrong.
const ANTHROPIC_MODELS = [
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5 — fastest & cheapest" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 — balanced (recommended)" },
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 — highest quality, highest cost" },
] as const;

const PROVIDERS = [
  { key: "openai", name: "OpenAI", sub: "Chat + embeddings" },
  { key: "anthropic", name: "Anthropic", sub: "Chat only" },
  { key: "gemini", name: "Google Gemini", sub: "Chat + embeddings" },
  { key: "custom", name: "Custom endpoint", sub: "OpenAI-compatible / self-hosted" },
] as const;

type Settings = {
  provider: string;
  hasApiKey: boolean;
  apiKeyLast4?: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  systemPrompt: string;
  fallbackReply: string;
  monthlyTokenBudget?: number;
  perVisitorDailyLimit: number;
  tokensUsedThisMonth: number;
};

function SaveBar({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="admin2-sticky-save">
      <span>{pending ? "Saving…" : dirty ? "You have unsaved changes." : "All changes are saved when you press Save."}</span>
      <button type="submit" className="admin2-btn" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

export function ModelSettingsForm({ settings }: { settings: Settings }) {
  const [dirty, setDirty] = useState(false);
  const [provider, setProvider] = useState(settings.provider);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [testStatus, setTestStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function testConnection() {
    if (!apiKey.trim()) {
      setTestStatus({ ok: false, message: "Enter an API key first." });
      return;
    }
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/chatbot/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, baseUrl: (document.getElementById("baseurl") as HTMLInputElement | null)?.value }),
      });
      const json = await res.json();
      setTestStatus({ ok: json.success, message: json.data?.message ?? json.error ?? "Failed." });
    } catch {
      setTestStatus({ ok: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <form action={saveModelSettingsAction} onChange={() => setDirty(true)} onSubmit={() => setDirty(false)}>
      <input type="hidden" name="provider" value={provider} />
      {/* Two columns of panels with one sticky Save bar, instead of one long column (QA LAIN-03). */}
      <div className="admin2-settings-grid">
        <section className="admin2-section">
          <div>
            <h2 style={{ fontSize: 17 }}>1 · Provider</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Where answers and embeddings come from.</p>
          </div>
          <div className="admin2-provider-grid" role="radiogroup" aria-label="AI provider">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={provider === p.key}
                className={`admin2-provider-card${provider === p.key ? " active" : ""}`}
                onClick={() => {
                  setProvider(p.key);
                  setDirty(true);
                }}
              >
                <span className="name-row">
                  <span className="name">{p.name}</span>
                  {provider === p.key && (
                    <span className="check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                  )}
                </span>
                <span className="sub">{p.sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin2-section">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
              <h2 style={{ fontSize: 17 }}>2 · API key</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Stored encrypted on the server. Never sent to visitors&apos; browsers.</p>
            </div>
            <span className={`admin2-chip-status ${settings.hasApiKey ? "connected" : "not-connected"}`}>
              <span className="dot" />
              {settings.hasApiKey ? `Connected · •••• ${settings.apiKeyLast4}` : "Not connected"}
            </span>
          </div>
          <div className="admin2-field">
            <label htmlFor="apikey">Secret key</label>
            <div className="admin2-key-input-row">
              <div className="admin2-key-input-wrap">
                <svg className="lock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="15" r="4" />
                  <path d="M10.8 12.2L20 3M16 7l3 3M18 5l2 2" />
                </svg>
                <input
                  id="apikey"
                  name="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder={settings.hasApiKey ? "Leave blank to keep current key" : "Paste your API key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button type="button" className="admin2-key-toggle" aria-label={showKey ? "Hide key" : "Show key"} onClick={() => setShowKey((s) => !s)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <button type="button" className="admin2-btn teal-outline" onClick={testConnection} disabled={testing}>
                {testing ? "Testing…" : "Test connection"}
              </button>
            </div>
            {testStatus && (
              <span style={{ fontSize: 13, fontWeight: 600, color: testStatus.ok ? "#146c43" : "#9d1b1b" }}>{testStatus.message}</span>
            )}
          </div>
          <div className="admin2-field">
            <label htmlFor="baseurl">
              Base URL <span style={{ fontWeight: 500, color: "#6b7573" }}>— only for custom endpoints</span>
            </label>
            <input id="baseurl" name="baseUrl" type="url" placeholder="https://api.example.com/v1" defaultValue={settings.baseUrl} disabled={provider !== "custom"} />
          </div>
        </section>

        <section className="admin2-section admin2-span-2">
          <div>
            <h2 style={{ fontSize: 17 }}>3 · Models &amp; answer style</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Set the model identifiers exactly as your provider names them.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div className="admin2-field">
              <label htmlFor="chatm">Chat model</label>
              {provider === "anthropic" ? (
                <select id="chatm" name="chatModel" defaultValue={ANTHROPIC_MODELS.some((m) => m.value === settings.chatModel) ? settings.chatModel : ANTHROPIC_MODELS[1].value}>
                  {ANTHROPIC_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input id="chatm" name="chatModel" type="text" placeholder={CHAT_MODEL_PLACEHOLDER[provider] ?? "model name"} defaultValue={settings.chatModel} />
              )}
            </div>
            <div className="admin2-field">
              <label htmlFor="embm">
                Embedding model{provider === "anthropic" && <span style={{ fontWeight: 500, color: "#6b7573" }}> — not used by Anthropic</span>}
              </label>
              <input
                id="embm"
                name="embeddingModel"
                type="text"
                placeholder={provider === "anthropic" ? "Not applicable" : "e.g. text-embedding-3-small"}
                defaultValue={settings.embeddingModel}
                disabled={provider === "anthropic"}
              />
              {provider === "anthropic" && (
                <span style={{ fontSize: 12.5, color: "#6b7573" }}>Anthropic has no embeddings API. Relevant content is still found by keyword search, then Claude writes the answer from it.</span>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {/* Claude 5 models reject a temperature parameter, so the slider would do nothing for Anthropic. */}
            {provider !== "anthropic" && (
              <div className="admin2-field">
                <label htmlFor="temp" style={{ display: "flex" }}>
                  Creativity<span style={{ marginLeft: "auto", color: "#15201f" }}>{temperature.toFixed(1)}</span>
                </label>
                <input
                  id="temp"
                  name="temperature"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ accentColor: "#0e6b73", margin: 0, background: "none", border: 0, padding: 0, height: "auto" }}
                />
                <span style={{ display: "flex", fontSize: 12, color: "#6b7573" }}>
                  <span>Precise</span>
                  <span style={{ marginLeft: "auto" }}>Creative</span>
                </span>
              </div>
            )}
            <div className="admin2-field">
              <label htmlFor="maxt">Max answer length</label>
              <input id="maxt" name="maxTokens" type="number" defaultValue={settings.maxTokens} />
            </div>
            <div className="admin2-field">
              <label htmlFor="topk">Sources per answer</label>
              <input id="topk" name="topK" type="number" defaultValue={settings.topK} />
            </div>
          </div>
          <div className="admin2-field">
            <label htmlFor="persona">Instructions (system prompt)</label>
            <textarea id="persona" name="systemPrompt" rows={5} defaultValue={settings.systemPrompt} />
          </div>
          <div className="admin2-field">
            <label htmlFor="fallback">Fallback reply when no answer is found</label>
            <input id="fallback" name="fallbackReply" type="text" defaultValue={settings.fallbackReply} />
          </div>
        </section>

        <section className="admin2-section">
          <div>
            <h2 style={{ fontSize: 17 }}>4 · Usage limits</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Keep costs predictable. The bot switches to the fallback reply when a limit is hit.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div className="admin2-field">
              <label htmlFor="budget">Monthly token budget</label>
              <input id="budget" name="monthlyTokenBudget" type="number" placeholder="e.g. 2000000" defaultValue={settings.monthlyTokenBudget} />
            </div>
            <div className="admin2-field">
              <label htmlFor="rate">Messages per visitor per day</label>
              <input id="rate" name="perVisitorDailyLimit" type="number" defaultValue={settings.perVisitorDailyLimit} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: "#5b6664" }}>Used this month</span>
              <span style={{ marginLeft: "auto", fontWeight: 700 }}>{settings.tokensUsedThisMonth.toLocaleString()} tokens</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#eeece6" }} />
          </div>
        </section>
      </div>
      <SaveBar dirty={dirty} />
    </form>
  );
}
