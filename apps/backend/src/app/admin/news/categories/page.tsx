import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { listNewsCategories } from "@/lib/newsCategories";
import { News } from "@/models/News";
import { NewsCategory } from "@/models/NewsCategory";

import { createCategoryAction, deleteCategoryAction, renameCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewsCategoriesPage() {
  await listNewsCategories(); // seeds defaults on first visit
  const categories = (await NewsCategory.find().sort({ name: 1 }).lean()) as unknown as { _id: string; name: string }[];
  const usage = (await News.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }])) as { _id: string; n: number }[];
  const countOf = (name: string) => usage.find((u) => u._id === name)?.n ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Categories</span>
      </div>
      <div className="admin2-header">
        <div>
          <h1>News categories</h1>
          <p>Categories group articles on the public site. Renaming updates every article that uses it.</p>
        </div>
      </div>

      <section className="admin2-section pad-sm" style={{ marginBottom: 20 }}>
        <h2>Add a category</h2>
        <form action={createCategoryAction} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="admin2-field" style={{ flex: "1 1 260px" }}>
            <label htmlFor="new-category">
              Name<span className="req">*</span>
            </label>
            <input id="new-category" name="name" type="text" required maxLength={40} placeholder="e.g. Award" />
          </div>
          <button type="submit" className="admin2-btn" style={{ marginTop: 29 }}>
            Add category
          </button>
        </form>
      </section>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
          <span>NAME</span>
          <span>ARTICLES</span>
          <span></span>
        </div>
        {categories.length === 0 && <p className="admin2-table-empty">No categories yet.</p>}
        {categories.map((c) => (
          <div key={String(c._id)} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 120px 96px" }}>
            <form action={renameCategoryAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="id" value={String(c._id)} />
              <input name="name" type="text" required maxLength={40} defaultValue={c.name} className="admin2-inline-input" aria-label={`Rename ${c.name}`} />
              <button type="submit" className="admin2-btn outline" style={{ height: 38 }}>
                Rename
              </button>
            </form>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{countOf(c.name)}</span>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={String(c._id)} />
              <ConfirmSubmit
                className="admin2-btn danger"
                style={{ height: 38 }}
                title={`Delete "${c.name}"?`}
                message={countOf(c.name) > 0 ? "Articles still use this category, so it can't be deleted until they're moved." : "This category will be removed from the list."}
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
