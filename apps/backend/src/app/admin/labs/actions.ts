"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createLabAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

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
}

export async function deleteLabAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Device.deleteMany({ lab: id });
  await Lab.findByIdAndDelete(id);
  revalidatePath("/admin/labs");
}

export async function createDeviceAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

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
}

export async function deleteDeviceAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  await Device.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/labs/devices");
}
