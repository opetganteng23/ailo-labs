import { model, models, Schema } from "mongoose";

const deviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specification: String,
    photo: String,
    lab: { type: Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    status: { type: String, enum: ["available", "booked", "maintenance"], default: "available" },
  },
  { timestamps: true },
);

export const Device = models.Device || model("Device", deviceSchema);
