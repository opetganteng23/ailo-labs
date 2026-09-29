"use client";

import { useMemo, useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { PasswordInput } from "@/components/PasswordInput";

import { createUserAction } from "./actions";

export type MemberOption = { _id: string; name: string; email: string; photo?: string; category: string; hasAccount: boolean };

/**
 * Two ways to add a user (QA LAIN-04):
 * - from an approved member: name, email and photo come from the member record,
 * - manually: for people who aren't members, with a photo upload.
 */
export function UserCreateForm({ members }: { members: MemberOption[] }) {
  const [mode, setMode] = useState<"member" | "manual">(members.length ? "member" : "manual");
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState("");
  const selected = members.find((m) => m._id === memberId);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    return members.filter((m) => !q || `${m.name} ${m.email}`.toLowerCase().includes(q)).slice(0, 8);
  }, [members, query]);

  return (
    <form action={createUserAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <input type="hidden" name="mode" value={mode} />
      <div className="admin2-radio-group" role="radiogroup" aria-label="How to add" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <button type="button" role="radio" aria-checked={mode === "member"} className={mode === "member" ? "active" : ""} onClick={() => setMode("member")}>
          From a member
        </button>
        <button type="button" role="radio" aria-checked={mode === "manual"} className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>
          Manual entry
        </button>
      </div>

      {mode === "member" ? (
        <>
          <input type="hidden" name="memberId" value={memberId} />
          {selected ? (
            <div className="member-pick-selected">
              {selected.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads
                <img src={selected.photo} alt="" />
              ) : (
                <span className="member-pick-avatar">{selected.name.charAt(0).toUpperCase()}</span>
              )}
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flexGrow: 1 }}>
                <strong>{selected.name}</strong>
                <span>{selected.email}</span>
                <span>{selected.category}</span>
              </span>
              <button type="button" className="admin2-btn outline" style={{ height: 36 }} onClick={() => setMemberId("")}>
                Change
              </button>
            </div>
          ) : (
            <div className="admin2-field">
              <label htmlFor="member-search">
                Member<span className="req">*</span>
              </label>
              <input
                id="member-search"
                type="search"
                placeholder="Search approved members by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required={!memberId}
                // Keeps the form from submitting until a member is actually picked.
                pattern={memberId ? undefined : "(?!)"}
                onInvalid={(e) => e.currentTarget.setCustomValidity("Pick a member from the list.")}
                onInput={(e) => e.currentTarget.setCustomValidity("")}
              />
              <div className="member-pick-list" role="listbox" aria-label="Members">
                {matches.length === 0 && <span className="member-pick-empty">No approved members match.</span>}
                {matches.map((m) => (
                  <button key={m._id} type="button" role="option" aria-selected={false} onClick={() => setMemberId(m._id)}>
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads
                      <img src={m.photo} alt="" />
                    ) : (
                      <span className="member-pick-avatar">{m.name.charAt(0).toUpperCase()}</span>
                    )}
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <strong>{m.name}</strong>
                      <span>
                        {m.email}
                        {m.hasAccount ? " · has a borrower account" : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12.5, color: "#6b7573" }}>
                Name, email and photo are copied from the member record. If the member already has an account, it is upgraded to the role below.
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="admin2-field">
            <label htmlFor="name">
              Name<span className="req">*</span>
            </label>
            <input id="name" name="name" required maxLength={160} />
          </div>
          <div className="admin2-field">
            <label htmlFor="email">
              Email<span className="req">*</span>
            </label>
            <input id="email" name="email" type="email" required />
          </div>
          <ImageUploadField name="photo" label="Photo" hint="Square portrait - PNG, JPG or WEBP" />
        </>
      )}

      <div className="admin2-field">
        <label htmlFor="role">
          Role<span className="req">*</span>
        </label>
        <select id="role" name="role" defaultValue="admin">
          <option value="admin">Admin</option>
          <option value="staff_lab">Staff (lab)</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>
      <div className="admin2-field">
        <label htmlFor="password">
          Password{mode === "member" && selected?.hasAccount ? "" : <span className="req">*</span>}
        </label>
        <PasswordInput
          id="password"
          name="password"
          minLength={8}
          required={!(mode === "member" && selected?.hasAccount)}
          autoComplete="new-password"
          placeholder={mode === "member" && selected?.hasAccount ? "Leave blank to keep their current password" : "At least 8 characters"}
        />
      </div>
      <button type="submit" className="admin2-btn" style={{ justifyContent: "center" }}>
        Create user
      </button>
    </form>
  );
}
