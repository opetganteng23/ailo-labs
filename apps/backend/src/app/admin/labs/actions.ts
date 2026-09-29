"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createLabAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const name = String(formData.get("name") ?? "").trim();
  await Lab.create({
    name,
    slug: slugify(name),
    location: String(formData.get("location") ?? ""),
    capacity: Number(formData.get("capacity") ?? 0) || undefined,
    description: String(formData.get("description") ?? ""),
    facilities: String(formData.get("facilities") ?? ""),
    photos: formData.get("photo") ? [String(formData.get("photo"))] : [],
  });
  revalidatePath("/admin/labs");
  redirect("/admin/labs");
}

export async function updateLabAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const photo = String(formData.get("photo") ?? "");
  await Lab.findByIdAndUpdate(id, {
    location: String(formData.get("location") ?? ""),
    capacity: Number(formData.get("capacity") ?? 0) || undefined,
    description: String(formData.get("description") ?? ""),
    facilities: String(formData.get("facilities") ?? ""),
    photos: photo ? [photo] : [],
  });
  revalidatePath("/admin/labs");
  revalidatePath(`/admin/labs/${id}`);
}

export async function deleteLabAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Device.deleteMany({ lab: id });
  await Lab.findByIdAndDelete(id);
  revalidatePath("/admin/labs");
}

export async function createDeviceAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const labId = String(formData.get("lab"));
  const device = await Device.create({
    name: String(formData.get("name") ?? "").trim(),
    specification: String(formData.get("specification") ?? ""),
    photo: String(formData.get("photo") ?? "") || undefined,
    lab: labId,
    status: formData.get("status") ?? "available",
  });
  await Lab.findByIdAndUpdate(labId, { $push: { devices: device._id } });
  revalidatePath("/admin/labs/devices");
  revalidatePath(`/admin/labs/${labId}`);
}

export async function updateDeviceAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const labId = String(formData.get("lab"));
  await Device.findByIdAndUpdate(id, {
    name: String(formData.get("name") ?? "").trim(),
    specification: String(formData.get("specification") ?? ""),
    photo: String(formData.get("photo") ?? "") || undefined,
    status: formData.get("status") ?? "available",
  });
  revalidatePath("/admin/labs/devices");
  revalidatePath(`/admin/labs/${labId}`);
}

export async function deleteDeviceAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const labId = String(formData.get("lab") ?? "");
  await Device.findByIdAndDelete(id);
  if (labId) {
    await Lab.findByIdAndUpdate(labId, { $pull: { devices: id } });
  }
  revalidatePath("/admin/labs/devices");
  if (labId) revalidatePath(`/admin/labs/${labId}`);
}
