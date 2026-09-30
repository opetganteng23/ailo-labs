import Link from "next/link";

import { listNewsCategories } from "@/lib/newsCategories";

import { NewsForm } from "../../../admin/news/NewsForm";
import { createDosenNewsAction, updateDosenNewsAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DosenNewsNewPage() {
  const categories = await listNewsCategories();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News drafts
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New draft</span>
      </div>
      <NewsForm mode="create" categories={categories} createAction={createDosenNewsAction} updateAction={updateDosenNewsAction} forReview />
    </div>
  );
}
