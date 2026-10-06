import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { EmptyState } from "@/components/EmptyState";
import { listMemberFaculties } from "@/lib/memberFacultiesDb";
import { Member } from "@/models/Member";
import { MemberFaculty } from "@/models/MemberFaculty";

import { createMemberFacultyAction, deleteMemberFacultyAction, renameMemberFacultyAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberFacultiesPage() {
  await listMemberFaculties(); // seeds the defaults on first visit
  const faculties = (await MemberFaculty.find().sort({ order: 1, name: 1 }).lean()) as unknown as { _id: string; name: string }[];
  const usage = (await Member.aggregate([{ $match: { faculty: { $exists: true, $ne: null } } }, { $group: { _id: "$faculty", n: { $sum: 1 } } }])) as { _id: string; n: number }[];
  const countOf = (name: string) => usage.find((u) => u._id === name)?.n ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/members" style={{ color: "#5b6664", fontWeight: 500 }}>
          Members
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Faculties</span>
      </div>
      <div className="admin2-header">
        <div>
          <h1>Member faculties</h1>
          <p>Shown on the Join form and used to filter the Members list. Renaming updates every member who has it.</p>
        </div>
      </div>

      <section className="admin2-section pad-sm" style={{ marginBottom: 20 }}>
        <h2>Add a faculty</h2>
        <form action={createMemberFacultyAction} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="admin2-field" style={{ flex: "1 1 320px" }}>
            <label htmlFor="new-member-faculty">
              Name<span className="req">*</span>
            </label>
            <input id="new-member-faculty" name="name" type="text" required maxLength={80} placeholder="e.g. Fakultas Teknik Elektro (FTE)" />
          </div>
          <button type="submit" className="admin2-btn" style={{ marginTop: 29 }}>
            Add faculty
          </button>
        </form>
      </section>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
          <span>NAME</span>
          <span>MEMBERS</span>
          <span></span>
        </div>
        {faculties.length === 0 && <EmptyState title="No faculties yet" message="Add a faculty above to group your members." />}
        {faculties.map((f) => (
          <div key={String(f._id)} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
            <form action={renameMemberFacultyAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="id" value={String(f._id)} />
              <input name="name" type="text" required maxLength={80} defaultValue={f.name} className="admin2-inline-input" aria-label={`Rename ${f.name}`} />
              <button type="submit" className="admin2-btn outline" style={{ height: 38 }}>
                Rename
              </button>
            </form>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{countOf(f.name)}</span>
            <form action={deleteMemberFacultyAction}>
              <input type="hidden" name="id" value={String(f._id)} />
              <ConfirmSubmit
                className="admin2-btn danger"
                style={{ height: 38 }}
                title={`Delete "${f.name}"?`}
                message={countOf(f.name) > 0 ? "Members still use this faculty, so it can't be deleted until they're moved." : "This faculty will be removed from the list."}
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
