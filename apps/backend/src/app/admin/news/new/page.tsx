import Link from "next/link";

import { NewsForm } from "../NewsForm";

export default function AdminNewsNewPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New article</span>
      </div>
      <NewsForm mode="create" />
    </div>
  );
}
