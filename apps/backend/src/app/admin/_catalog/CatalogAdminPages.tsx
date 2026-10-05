import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { catalogModel, CATALOG, type CatalogKind } from "@/lib/catalog";
import { connectToDatabase } from "@/lib/mongodb";

import { deleteCatalogAction } from "./actions";
import { CatalogForm, type CatalogInitial } from "./CatalogForm";

const COLUMNS = "minmax(0, 1fr) 120px 80px 96px";

export async function CatalogAdminList({ kind }: { kind: CatalogKind }) {
  const config = CATALOG[kind];
  await connectToDatabase();
  const items = (await catalogModel(kind).find().sort({ order: 1, title: 1 }).lean()) as unknown as CatalogInitial[];

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>{config.label}</h1>
          <p>{config.intro}</p>
        </div>
        <div className="admin2-actions">
          <Link href={`/admin/${kind}/new`} className="admin2-btn">
            Add {config.singular}
          </Link>
        </div>
      </div>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: COLUMNS }}>
          <span>{config.singular.toUpperCase()}</span>
          <span>STATUS</span>
          <span>ORDER</span>
          <span></span>
        </div>
        {items.length === 0 && <p className="admin2-table-empty">Nothing here yet.</p>}
        {items.map((item) => (
          <div key={String(item._id)} className="admin2-table-row" style={{ gridTemplateColumns: COLUMNS }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image
                <img src={item.image} alt="" className="admin2-thumb" style={{ objectFit: "contain", background: "#fff" }} />
              ) : (
                <div className="admin2-thumb" />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <Link href={`/admin/${kind}/${item._id}`} style={{ fontSize: 15, fontWeight: 700, color: "#15201f" }}>
                  {item.title}
                </Link>
                {(item.author || item.link) && <span style={{ fontSize: 13, color: "#6b7573" }}>{item.author ?? item.link}</span>}
              </div>
            </div>
            <span className={`admin2-pill ${item.status === "draft" ? "draft" : "published"}`}>
              <span className="dot" />
              {item.status === "draft" ? "Draft" : "Published"}
            </span>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{item.order ?? 0}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Link href={`/admin/${kind}/${item._id}`} aria-label="Edit" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
              </Link>
              <form action={deleteCatalogAction}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={String(item._id)} />
                <ConfirmSubmit
                  title={`Delete this ${config.singular}?`}
                  message="It will be removed from the admin and the public site."
                  confirmLabel="Delete"
                  ariaLabel="Delete"
                  className="admin2-btn ghost"
                  style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                  </svg>
                </ConfirmSubmit>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export async function CatalogAdminEdit({ kind, id }: { kind: CatalogKind; id?: string }) {
  const config = CATALOG[kind];
  let initial: CatalogInitial | undefined;
  if (id) {
    await connectToDatabase();
    const doc = (await catalogModel(kind).findById(id).lean()) as unknown as CatalogInitial | null;
    if (!doc) notFound();
    initial = { ...doc, _id: String(doc._id) };
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href={`/admin/${kind}`} style={{ color: "#5b6664", fontWeight: 500 }}>
          {config.label}
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{initial ? initial.title : `New ${config.singular}`}</span>
      </div>
      <CatalogForm config={config} initial={initial} />
    </div>
  );
}
