import { model, models, Schema } from "mongoose";

const memberFacultySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const MemberFaculty = models.MemberFaculty || model("MemberFaculty", memberFacultySchema);
