"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { catalogModel, CATALOG, isCatalogKind, type CatalogKind } from "@/lib/catalog";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { sanitizeRichText } from "@/lib/sanitizeHtml";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireAdminKind(formData: FormData): Promise<CatalogKind> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  const kind = String(formData.get("kind") ?? "");
  if (!isCatalogKind(kind)) redirect("/admin/dashboard");
  return kind;
}

function kindIsPartner(kind: CatalogKind) {
  return kind === "partners";
}

function readEntry(kind: CatalogKind, formData: FormData) {
  const cfg = CATALOG[kind];
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new FlashError(`Please fill in the ${cfg.titleLabel.toLowerCase()}.`, "warning");
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    title,
    description: text("description"),
    content: cfg.content ? sanitizeRichText(String(formData.get("content") ?? "")) : "",
    // Empty strings (not undefined) so clearing a field actually clears it - Mongoose ignores undefined on update.
    image: text("image"),
    link: cfg.link ? text("link") : "",
    author: cfg.author ? text("author") : "",
    year: cfg.year ? text("year") : "",
    logoDark: kindIsPartner(cfg.kind) ? formData.get("logoDark") === "on" : false,
    order: Number(formData.get("order") ?? 0) || 0,
    status: formData.get("status") === "draft" ? "draft" : "published",
  };
}

function refresh(kind: CatalogKind) {
  revalidatePath(`/admin/${kind}`);
  const publicPath = CATALOG[kind].publicPath;
  if (publicPath) revalidatePath(publicPath);
  revalidatePath("/");
}

export async function createCatalogAction(formData: FormData) {
  const kind = await requireAdminKind(formData);
  const ok = await withFlash(
    async () => {
      const data = readEntry(kind, formData);
      await connectToDatabase();
      await catalogModel(kind).create({ ...data, slug: slugify(data.title) });
    },
    { success: `${CATALOG[kind].singular[0].toUpperCase()}${CATALOG[kind].singular.slice(1)} saved.`, error: "Couldn't save. Please try again." },
  );
  refresh(kind);
  if (ok) redirect(`/admin/${kind}`);
}

export async function updateCatalogAction(formData: FormData) {
  const kind = await requireAdminKind(formData);
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const data = readEntry(kind, formData);
      await connectToDatabase();
      await catalogModel(kind).findByIdAndUpdate(id, data);
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  refresh(kind);
  if (ok) redirect(`/admin/${kind}`);
}

export async function deleteCatalogAction(formData: FormData) {
  const kind = await requireAdminKind(formData);
  await withFlash(
    async () => {
      await connectToDatabase();
      await catalogModel(kind).findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Deleted.", error: "Couldn't delete. Please try again." },
  );
  refresh(kind);
}
