import Link from "next/link";

export type BoardColumn = {
  key: string;
  label: string;
  items: { id: string; title: string; subtitle?: string; href: string }[];
};

/** Read-only board grouping CMS items by status; each card links to its editor. */
export function StatusBoard({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className="status-board">
      {columns.map((col) => (
        <section key={col.key} className="status-board-col">
          <header>
            <span className={`admin2-pill ${col.key}`}>
              <span className="dot" />
              {col.label}
            </span>
            <span className="count">{col.items.length}</span>
          </header>
          {col.items.length === 0 && <p className="status-board-empty">Nothing here</p>}
          {col.items.map((item) => (
            <Link key={item.id} href={item.href} className="status-board-card">
              <strong>{item.title}</strong>
              {item.subtitle && <span>{item.subtitle}</span>}
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
