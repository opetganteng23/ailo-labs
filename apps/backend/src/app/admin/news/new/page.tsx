import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { listNewsCategories } from "@/lib/newsCategories";

import { NewsForm } from "../NewsForm";

export const dynamic = "force-dynamic";

export default async function AdminNewsNewPage() {
  await connectToDatabase();
  const categories = await listNewsCategories();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New article</span>
      </div>
      <NewsForm mode="create" categories={categories} />
    </div>
  );
}
