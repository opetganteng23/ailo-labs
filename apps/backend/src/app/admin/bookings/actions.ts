"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { flash, FlashError, withFlash } from "@/lib/flash";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";

export async function reviewBookingAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  const status = String(formData.get("status"));
  if (!["approved", "rejected"].includes(status)) return;

  let mailSent = true;
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const booking = await Booking.findByIdAndUpdate(
        String(formData.get("id")),
        { status, reviewedBy: session.sub },
        { new: true },
      ).populate("lab", "name");
      if (!booking) throw new FlashError("This booking no longer exists.");

      if (status === "approved" && booking.device) {
        await Device.findByIdAndUpdate(booking.device, { status: "booked" });
      }

      const labName = (booking.lab as unknown as { name?: string })?.name ?? "the lab";
      const mail = await sendMail({
        to: booking.borrowerEmail,
        subject: `AILO Lab Booking ${status === "approved" ? "Approved" : "Rejected"}`,
        text: `Halo ${booking.borrowerName},

Status permintaan peminjaman lab "${labName}" Anda: ${status}.

Terima kasih,
Tim AILO`,
      });
      mailSent = mail.sent;
    },
    { success: status === "approved" ? "Booking approved." : "Booking rejected.", error: "Couldn't update the booking. Please try again." },
  );
  if (ok && !mailSent) await flash("error", "The borrower could not be emailed - check the mail settings.");

  revalidatePath("/admin/bookings");
}
