"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";

export async function reviewBookingAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const status = String(formData.get("status"));
  if (!["approved", "rejected"].includes(status)) return;

  await connectToDatabase();
  const booking = await Booking.findByIdAndUpdate(
    String(formData.get("id")),
    { status, reviewedBy: session.sub },
    { new: true },
  ).populate("lab", "name");

  if (booking && status === "approved" && booking.device) {
    await Device.findByIdAndUpdate(booking.device, { status: "booked" });
  }

  if (booking) {
    const labName = (booking.lab as unknown as { name?: string })?.name ?? "the lab";
    await sendMail({
      to: booking.borrowerEmail,
      subject: `AILO Lab Booking ${status === "approved" ? "Approved" : "Rejected"}`,
      text: `Halo ${booking.borrowerName},\n\nStatus permintaan peminjaman lab "${labName}" Anda: ${status}.\n\nTerima kasih,\nTim AILO`,
    });
  }

  revalidatePath("/admin/bookings");
}
