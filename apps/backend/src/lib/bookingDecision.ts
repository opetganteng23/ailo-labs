import crypto from "node:crypto";

import QRCode from "qrcode";

import { getBaseUrl } from "@/lib/baseUrl";
import { sendMail } from "@/lib/mailer";

type BookingDoc = {
  _id: unknown;
  borrowerName: string;
  borrowerEmail: string;
  startDateTime: Date;
  endDateTime: Date;
  accessCode?: string;
  lab?: unknown;
  device?: unknown;
  save: () => Promise<unknown>;
};

const fmt = (d: Date) =>
  d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Gives an approved booking its door code (once) and returns the pass URL behind the QR. */
export async function ensureAccessCode(booking: BookingDoc): Promise<string> {
  if (!booking.accessCode) {
    booking.accessCode = crypto.randomBytes(18).toString("base64url");
    await booking.save();
  }
  return `${await getBaseUrl()}/booking-pass/${booking.accessCode}`;
}

/**
 * Emails the borrower the admin's decision. An approval carries a QR code that
 * opens the booking pass, which staff scan at the lab to check the booking is
 * valid for the current time window.
 */
export async function sendBookingDecision(booking: BookingDoc, status: string, note?: string): Promise<{ sent: boolean }> {
  const labName = (booking.lab as { name?: string } | undefined)?.name ?? "lab AILO";
  const deviceName = (booking.device as { name?: string } | undefined)?.name;
  const what = deviceName ? `${deviceName} (${labName})` : labName;
  const when = `${fmt(booking.startDateTime)} s.d. ${fmt(booking.endDateTime)}`;
  const noteText = note ? `\nCatatan admin: ${note}` : "";

  if (status !== "approved") {
    return sendMail({
      to: booking.borrowerEmail,
      subject: status === "rejected" ? "AILO Lab Booking Rejected" : "AILO Lab Booking Updated",
      text: `Halo ${booking.borrowerName},\n\nPermintaan peminjaman ${what} untuk ${when} ${status === "rejected" ? "belum dapat kami setujui" : `berstatus: ${status}`}.${noteText}\n\nTerima kasih,\nTim AILO`,
    });
  }

  const passUrl = await ensureAccessCode(booking);
  const qr = await QRCode.toBuffer(passUrl, { width: 360, margin: 1, color: { dark: "#0b1e20", light: "#ffffff" } });

  const text = `Halo ${booking.borrowerName},\n\nPeminjaman ${what} Anda DISETUJUI.\nWaktu: ${when} WIB\n\nTunjukkan QR code di email ini kepada petugas lab untuk masuk dan memakai perangkat. QR hanya berlaku pada waktu peminjaman di atas.\nPass online: ${passUrl}${noteText}\n\nTerima kasih,\nTim AILO`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#15201f;max-width:560px;margin:0 auto">
  <div style="background:#00495a;color:#fff;padding:22px 26px;border-radius:14px 14px 0 0">
    <div style="font-size:12px;letter-spacing:.12em;color:#9dc0c1;font-weight:bold">AILO LAB BOOKING</div>
    <div style="font-size:22px;font-weight:bold;margin-top:4px">Peminjaman disetujui</div>
  </div>
  <div style="border:1px solid #e3e1da;border-top:0;border-radius:0 0 14px 14px;padding:24px 26px">
    <p style="margin:0 0 14px">Halo ${escapeHtml(booking.borrowerName)},</p>
    <p style="margin:0 0 18px">Peminjaman <b>${escapeHtml(what)}</b> Anda telah disetujui.</p>
    <table style="font-size:14px;margin-bottom:18px" cellpadding="4">
      <tr><td style="color:#6b7573">Mulai</td><td><b>${escapeHtml(fmt(booking.startDateTime))} WIB</b></td></tr>
      <tr><td style="color:#6b7573">Selesai</td><td><b>${escapeHtml(fmt(booking.endDateTime))} WIB</b></td></tr>
    </table>
    <div style="text-align:center;padding:18px;background:#f7f5f0;border-radius:12px">
      <img src="cid:booking-qr" width="220" height="220" alt="QR code peminjaman" style="display:block;margin:0 auto 10px">
      <div style="font-size:13px;color:#4e5957">Tunjukkan QR ini ke petugas lab. Hanya berlaku pada waktu di atas.</div>
    </div>
    ${note ? `<p style="margin:18px 0 0;font-size:14px"><b>Catatan admin:</b> ${escapeHtml(note)}</p>` : ""}
    <p style="margin:18px 0 0;font-size:13px;color:#6b7573">Tidak bisa melihat gambar? Buka pass online: <a href="${passUrl}" style="color:#00809d">${passUrl}</a></p>
  </div>
</div>`;

  return sendMail({
    to: booking.borrowerEmail,
    subject: "AILO Lab Booking Approved - Your Access QR",
    text,
    html,
    attachments: [{ filename: "ailo-booking-qr.png", content: qr, cid: "booking-qr", contentType: "image/png" }],
  });
}
