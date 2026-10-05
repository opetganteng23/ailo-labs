"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { isHtmlTrusted } from "@/lib/htmlTrust";
import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

/** Every lecturer action runs as the signed-in dosen and only touches their own items. */
async function requireDosen() {
  const session = await getSession();
  if (!session || session.role !== "dosen") redirect("/login");
  return session;
}

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(model: { exists: (q: object) => Promise<unknown> }, title: string) {
  const base = slugify(title) || "item";
  let slug = base;
  for (let i = 2; await model.exists({ slug }); i++) slug = `${base}-${i}`;
  return slug;
}

/** Published items are locked for lecturers; an admin changes them. */
async function ownEditable<T extends { owner?: unknown; status?: string; publishStatus?: string; author?: unknown }>(
  doc: T | null,
  userId: string,
  ownerField: "owner" | "author" = "owner",
) {
  if (!doc || String(doc[ownerField]) !== userId) throw new FlashError("You can only change your own items.");
  if (doc.status === "published" || doc.publishStatus === "published") {
    throw new FlashError("This item is already published. Ask an AILO admin to change it.");
  }
}

function readTitleSummary(formData: FormData, trusted: boolean) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) throw new FlashError(`Please fill in the ${[!title && "title", !description && "summary"].filter(Boolean).join(" and ")}.`, "warning");
  return { title, description, content: sanitizeRichText(String(formData.get("content") ?? ""), { trusted }) };
}

// ---------- Research ----------

export async function createDosenResearchAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      const data = readTitleSummary(formData, await isHtmlTrusted(session.sub));
      await connectToDatabase();
      await Research.create({
        ...data,
        slug: await uniqueSlug(Research, data.title),
        image: String(formData.get("image") ?? "") || undefined,
        status: "review",
        owner: session.sub,
      });
    },
    { success: "Research submitted for review.", error: "Couldn't submit the research. Please try again." },
  );
  revalidatePath("/dosen/research");
  if (ok) redirect("/dosen/research");
}

export async function updateDosenResearchAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await ownEditable(await Research.findById(id).lean<{ owner?: unknown; status?: string }>(), session.sub);
      await Research.findByIdAndUpdate(id, {
        ...readTitleSummary(formData, await isHtmlTrusted(session.sub)),
        image: String(formData.get("image") ?? "") || undefined,
        status: "review",
      });
    },
    { success: "Changes submitted for review.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/dosen/research");
  if (ok) redirect("/dosen/research");
}

export async function deleteDosenResearchAction(formData: FormData) {
  const session = await requireDosen();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await ownEditable(await Research.findById(id).lean<{ owner?: unknown; status?: string }>(), session.sub);
      await Research.findByIdAndDelete(id);
    },
    { success: "Research deleted.", error: "Couldn't delete the research. Please try again." },
  );
  revalidatePath("/dosen/research");
}

// ---------- Projects ----------

export async function createDosenProjectAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      const data = readTitleSummary(formData, await isHtmlTrusted(session.sub));
      await connectToDatabase();
      await Project.create({
        ...data,
        slug: await uniqueSlug(Project, data.title),
        status: formData.get("status") ?? "planned",
        images: formData.get("image") ? [String(formData.get("image"))] : [],
        publishStatus: "review",
        owner: session.sub,
      });
    },
    { success: "Project submitted for review.", error: "Couldn't submit the project. Please try again." },
  );
  revalidatePath("/dosen/projects");
  if (ok) redirect("/dosen/projects");
}

export async function updateDosenProjectAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await ownEditable(await Project.findById(id).lean<{ owner?: unknown; publishStatus?: string }>(), session.sub);
      await Project.findByIdAndUpdate(id, {
        ...readTitleSummary(formData, await isHtmlTrusted(session.sub)),
        status: formData.get("status") ?? "planned",
        images: formData.get("image") ? [String(formData.get("image"))] : [],
        publishStatus: "review",
      });
    },
    { success: "Changes submitted for review.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/dosen/projects");
  if (ok) redirect("/dosen/projects");
}

export async function deleteDosenProjectAction(formData: FormData) {
  const session = await requireDosen();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await ownEditable(await Project.findById(id).lean<{ owner?: unknown; publishStatus?: string }>(), session.sub);
      await Project.findByIdAndDelete(id);
    },
    { success: "Project deleted.", error: "Couldn't delete the project. Please try again." },
  );
  revalidatePath("/dosen/projects");
}

// ---------- News drafts ----------

function readNews(formData: FormData, trusted: boolean) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = sanitizeRichText(String(formData.get("content") ?? ""), { trusted }).trim();
  const category = String(formData.get("category") ?? "").trim();
  const missing = [!title && "headline", !summary && "summary", !content && "article body", !category && "category"].filter(Boolean);
  if (missing.length) throw new FlashError(`Please fill in the ${missing.join(", ")}.`, "warning");
  const v = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    title,
    summary,
    content,
    category,
    tags: v("tags").split(",").map((t) => t.trim()).filter(Boolean),
    images: formData.get("image") ? [String(formData.get("image"))] : [],
    source5W1H: { what: v("what"), who: v("who"), when: v("when"), where: v("where"), why: v("why"), how: v("how") },
  };
}

export async function createDosenNewsAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      const data = readNews(formData, await isHtmlTrusted(session.sub));
      await connectToDatabase();
      await News.create({ ...data, slug: await uniqueSlug(News, data.title), status: "review", author: session.sub });
    },
    { success: "Draft sent to the admins for review.", error: "Couldn't submit the draft. Please try again." },
  );
  revalidatePath("/dosen/news");
  if (ok) redirect("/dosen/news");
}

export async function updateDosenNewsAction(formData: FormData) {
  const session = await requireDosen();
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await ownEditable(await News.findById(id).lean<{ author?: unknown; status?: string }>(), session.sub, "author");
      await News.findByIdAndUpdate(id, { ...readNews(formData, await isHtmlTrusted(session.sub)), status: "review" });
    },
    { success: "Draft updated and sent for review.", error: "Couldn't save the draft. Please try again." },
  );
  revalidatePath("/dosen/news");
  if (ok) redirect("/dosen/news");
}

// ---------- Profile ----------

const PROFILE_FIELDS = ["position", "jenjang", "studyProgram", "bio", "photo"] as const;

export async function saveDosenProfileAction(formData: FormData) {
  const session = await requireDosen();
  await withFlash(
    async () => {
      await connectToDatabase();
      const user = await User.findById(session.sub).lean<{ team?: unknown }>();
      if (!user?.team) throw new FlashError("Your account isn't linked to a team profile yet. Ask an AILO admin to link it.");

      const changes: Record<string, unknown> = {};
      for (const f of PROFILE_FIELDS) changes[f] = String(formData.get(f) ?? "").trim();
      if (!changes.position) throw new FlashError("Please fill in your position.");
      changes.researchInterests = String(formData.get("researchInterests") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);
      changes.profiles = {
        linkedin: String(formData.get("linkedin") ?? "").trim(),
        orcid: String(formData.get("orcid") ?? "").trim(),
        googleScholar: String(formData.get("googleScholar") ?? "").trim(),
        sinta: String(formData.get("sinta") ?? "").trim(),
        scopus: String(formData.get("scopus") ?? "").trim(),
      };
      await Team.findByIdAndUpdate(user.team, { pendingChanges: changes, pendingSince: new Date() });
    },
    { success: "Profile changes sent to the admins for approval.", error: "Couldn't save your profile. Please try again." },
  );
  revalidatePath("/dosen/profile");
}
