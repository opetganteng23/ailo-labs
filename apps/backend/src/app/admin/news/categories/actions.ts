"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { NewsCategory } from "@/models/NewsCategory";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function readName(value: FormDataEntryValue | null) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!name) throw new FlashError("Category name is required.");
  if (name.length > 40) throw new FlashError("Category name must be 40 characters or fewer.");
  return name;
}

async function assertUnique(name: string, exceptId?: string) {
  const existing = await NewsCategory.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }).lean<{ _id: unknown }>();
  if (existing && String(existing._id) !== exceptId) throw new FlashError(`"${name}" already exists.`);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name);
      await NewsCategory.create({ name });
    },
    { success: "Category added.", error: "Couldn't add the category. Please try again." },
  );
  revalidatePath("/admin/news/categories");
}

export async function renameCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const id = String(formData.get("id"));
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name, id);
      const current = await NewsCategory.findById(id);
      if (!current) throw new FlashError("That category no longer exists.");
      const oldName = current.name as string;
      current.name = name;
      await current.save();
      // Keep articles pointing at the renamed category.
      await News.updateMany({ category: oldName }, { category: name });
    },
    { success: "Category renamed.", error: "Couldn't rename the category. Please try again." },
  );
  revalidatePath("/admin/news/categories");
  revalidatePath("/admin/news");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const category = await NewsCategory.findById(String(formData.get("id"))).lean<{ name: string }>();
      if (!category) return;
      const inUse = await News.countDocuments({ category: category.name });
      if (inUse > 0) {
        throw new FlashError(`"${category.name}" is used by ${inUse} article${inUse === 1 ? "" : "s"}. Move them to another category first.`);
      }
      await NewsCategory.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Category deleted.", error: "Couldn't delete the category. Please try again." },
  );
  revalidatePath("/admin/news/categories");
}

/** Used by the "+ Add category" button inside the article form (no navigation). */
export async function addCategoryInlineAction(rawName: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  await requireAdmin();
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Category name is required." };
  if (name.length > 40) return { ok: false, error: "Category name must be 40 characters or fewer." };
  try {
    await connectToDatabase();
    await assertUnique(name);
    await NewsCategory.create({ name });
    revalidatePath("/admin/news/categories");
    return { ok: true, name };
  } catch (error) {
    if (error instanceof FlashError) return { ok: false, error: error.message };
    console.error("Failed to add category", error);
    return { ok: false, error: "Couldn't add the category. Please try again." };
  }
}
