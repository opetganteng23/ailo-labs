"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function labDetails(formData: FormData) {
  const photo = String(formData.get("photo") ?? "");
  return {
    location: String(formData.get("location") ?? "").trim(),
    capacity: Number(formData.get("capacity") ?? 0) || undefined,
    description: String(formData.get("description") ?? ""),
    facilities: String(formData.get("facilities") ?? ""),
    photos: photo ? [photo] : [],
  };
}

export async function createLabAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const name = String(formData.get("name") ?? "").trim();
      if (!name) throw new FlashError("Please fill in the lab name.");
      await connectToDatabase();
      await Lab.create({ name, slug: slugify(name), ...labDetails(formData) });
    },
    { success: "Lab added.", error: "Couldn't add the lab. Please try again." },
  );
  revalidatePath("/admin/labs");
  if (ok) redirect("/admin/labs");
}

export async function updateLabAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await withFlash(
    async () => {
      await connectToDatabase();
      await Lab.findByIdAndUpdate(id, labDetails(formData));
    },
    { success: "Lab details saved.", error: "Couldn't save the lab details. Please try again." },
  );
  revalidatePath("/admin/labs");
  revalidatePath(`/admin/labs/${id}`);
}

export async function deleteLabAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      await Device.deleteMany({ lab: id });
      await Lab.findByIdAndDelete(id);
    },
    { success: "Lab deleted.", error: "Couldn't delete the lab. Please try again." },
  );
  revalidatePath("/admin/labs");
}

function deviceDetails(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new FlashError("Please fill in the device name.");
  return {
    name,
    specification: String(formData.get("specification") ?? ""),
    photo: String(formData.get("photo") ?? "") || undefined,
    status: formData.get("status") ?? "available",
  };
}

export async function createDeviceAction(formData: FormData) {
  await requireAdmin();
  const labId = String(formData.get("lab") ?? "");
  await withFlash(
    async () => {
      if (!labId) throw new FlashError("Please choose the lab this device belongs to.");
      const details = deviceDetails(formData);
      await connectToDatabase();
      const device = await Device.create({ ...details, lab: labId });
      await Lab.findByIdAndUpdate(labId, { $push: { devices: device._id } });
    },
    { success: "Device added.", error: "Couldn't add the device. Please try again." },
  );
  revalidatePath("/admin/labs/devices");
  if (labId) revalidatePath(`/admin/labs/${labId}`);
}

export async function updateDeviceAction(formData: FormData) {
  await requireAdmin();
  const labId = String(formData.get("lab") ?? "");
  await withFlash(
    async () => {
      const details = deviceDetails(formData);
      await connectToDatabase();
      await Device.findByIdAndUpdate(String(formData.get("id")), details);
    },
    { success: "Device saved.", error: "Couldn't save the device. Please try again." },
  );
  revalidatePath("/admin/labs/devices");
  if (labId) revalidatePath(`/admin/labs/${labId}`);
}

export async function deleteDeviceAction(formData: FormData) {
  await requireAdmin();
  const labId = String(formData.get("lab") ?? "");
  await withFlash(
    async () => {
      const id = String(formData.get("id"));
      await connectToDatabase();
      await Device.findByIdAndDelete(id);
      if (labId) await Lab.findByIdAndUpdate(labId, { $pull: { devices: id } });
    },
    { success: "Device deleted.", error: "Couldn't delete the device. Please try again." },
  );
  revalidatePath("/admin/labs/devices");
  if (labId) revalidatePath(`/admin/labs/${labId}`);
}
