"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";
import { TeamCategory } from "@/models/TeamCategory";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function readName(value: FormDataEntryValue | null) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!name) throw new FlashError("Category name is required.", "warning");
  if (name.length > 40) throw new FlashError("Category name must be 40 characters or fewer.", "warning");
  return name;
}

async function assertUnique(name: string, exceptId?: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = await TeamCategory.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } }).lean<{ _id: unknown }>();
  if (existing && String(existing._id) !== exceptId) throw new FlashError(`"${name}" already exists.`, "warning");
}

function refresh() {
  revalidatePath("/admin/team/categories");
  revalidatePath("/admin/team");
  revalidatePath("/team");
}

export async function createTeamCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name);
      const order = await TeamCategory.countDocuments();
      await TeamCategory.create({ name, order });
    },
    { success: "Category added.", error: "Couldn't add the category. Please try again." },
  );
  refresh();
}

export async function renameTeamCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const id = String(formData.get("id"));
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name, id);
      const current = await TeamCategory.findById(id);
      if (!current) throw new FlashError("That category no longer exists.");
      const oldName = current.name as string;
      current.name = name;
      await current.save();
      await Team.updateMany({ category: oldName }, { category: name });
      await Team.updateMany({ categories: oldName }, { $set: { "categories.$": name } });
      await Member.updateMany({ teamCategories: oldName }, { $set: { "teamCategories.$": name } });
      await Member.updateMany({ teamCategory: oldName }, { teamCategory: name });
    },
    { success: "Category renamed.", error: "Couldn't rename the category. Please try again." },
  );
  refresh();
}

/** Swaps a category with its neighbour above/below, so admins can rank them (most senior first) without retyping every `order` value. */
export async function moveTeamCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      const direction = String(formData.get("direction"));
      const ordered = await TeamCategory.find().sort({ order: 1, name: 1 });
      const index = ordered.findIndex((c) => String(c._id) === id);
      if (index === -1) throw new FlashError("That category no longer exists.");
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= ordered.length) return;

      // Orders are just a sequence (0, 1, 2, ...), so swapping the two documents' `order`
      // values is enough - no need to renumber the rest of the list.
      const a = ordered[index];
      const b = ordered[swapWith];
      const aOrder = a.order;
      a.order = b.order;
      b.order = aOrder;
      await a.save();
      await b.save();
    },
    { success: "Order updated.", error: "Couldn't change the order. Please try again." },
  );
  refresh();
}

export async function deleteTeamCategoryAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      const category = await TeamCategory.findById(id).lean<{ name: string }>();
      if (!category) return;
      const inTeam = await Team.countDocuments({ $or: [{ category: category.name }, { categories: category.name }] });
      const inMembers = await Member.countDocuments({ $or: [{ teamCategory: category.name }, { teamCategories: category.name }] });
      if (inTeam + inMembers > 0) {
        throw new FlashError(`"${category.name}" is still used by ${inTeam} team profile${inTeam === 1 ? "" : "s"}${inMembers ? ` and ${inMembers} member${inMembers === 1 ? "" : "s"}` : ""}. Move them to another category first.`, "warning");
      }
      await TeamCategory.findByIdAndDelete(id);
    },
    { success: "Category deleted.", error: "Couldn't delete the category. Please try again." },
  );
  refresh();
}
