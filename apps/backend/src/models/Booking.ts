import { model, models, Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    borrowerName: { type: String, required: true, trim: true },
    borrowerEmail: { type: String, required: true, lowercase: true, trim: true },
    borrowerPhone: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    lab: { type: Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    device: { type: Schema.Types.ObjectId, ref: "Device", index: true },
    purpose: { type: String, required: true },
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: String,
  },
  { timestamps: true },
);

bookingSchema.index({ lab: 1, device: 1, startDateTime: 1, endDateTime: 1 });

export const Booking = models.Booking || model("Booking", bookingSchema);
