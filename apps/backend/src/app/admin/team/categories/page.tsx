import { categoriesOf } from "@/lib/teamCats";
import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { EmptyState } from "@/components/EmptyState";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";
import { TeamCategory } from "@/models/TeamCategory";

import { createTeamCategoryAction, deleteTeamCategoryAction, renameTeamCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamCategoriesPage() {
  await listTeamCategories(); // seeds the defaults on first visit
  const categories = (await TeamCategory.find().sort({ order: 1, name: 1 }).lean()) as unknown as { _id: string; name: string }[];
  const teamRows = (await Team.find().select("category categories").lean()) as unknown as { category?: string; categories?: string[] }[];
  const teamUsage = Object.entries(teamRows.flatMap((t) => categoriesOf(t)).reduce<Record<string, number>>((acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }), {})).map(([_id, n]) => ({ _id, n }));
  const memberUsage = (await Member.aggregate([{ $match: { teamCategory: { $exists: true } } }, { $group: { _id: "$teamCategory", n: { $sum: 1 } } }])) as { _id: string; n: number }[];
  const countOf = (name: string) => (teamUsage.find((u) => u._id === name)?.n ?? 0) + (memberUsage.find((u) => u._id === name)?.n ?? 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/team" style={{ color: "#5b6664", fontWeight: 500 }}>
          Team
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Categories</span>
      </div>
      <div className="admin2-header">
        <div>
          <h1>Team categories</h1>
          <p>Categories group people on the public Team page, in the order shown here. Renaming updates every profile that uses it.</p>
        </div>
      </div>

      <section className="admin2-section pad-sm" style={{ marginBottom: 20 }}>
        <h2>Add a category</h2>
        <form action={createTeamCategoryAction} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="admin2-field" style={{ flex: "1 1 260px" }}>
            <label htmlFor="new-team-category">
              Name<span className="req">*</span>
            </label>
            <input id="new-team-category" name="name" type="text" required maxLength={40} placeholder="e.g. Research Partner" />
          </div>
          <button type="submit" className="admin2-btn" style={{ marginTop: 29 }}>
            Add category
          </button>
        </form>
      </section>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
          <span>NAME</span>
          <span>PEOPLE</span>
          <span></span>
        </div>
        {categories.length === 0 && <EmptyState title="No categories yet" message="Add a category above to group your team." />}
        {categories.map((c) => (
          <div key={String(c._id)} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
            <form action={renameTeamCategoryAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="id" value={String(c._id)} />
              <input name="name" type="text" required maxLength={40} defaultValue={c.name} className="admin2-inline-input" aria-label={`Rename ${c.name}`} />
              <button type="submit" className="admin2-btn outline" style={{ height: 38 }}>
                Rename
              </button>
            </form>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{countOf(c.name)}</span>
            <form action={deleteTeamCategoryAction}>
              <input type="hidden" name="id" value={String(c._id)} />
              <ConfirmSubmit
                className="admin2-btn danger"
                style={{ height: 38 }}
                title={`Delete "${c.name}"?`}
                message={countOf(c.name) > 0 ? "People still use this category, so it can't be deleted until they're moved." : "This category will be removed from the list."}
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
