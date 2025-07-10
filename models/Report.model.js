const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: {
      type: String,
      enum: ["Inappropriate Content", "Spam", "Harassment", "Other"],
      required: true,
    },
    message: {
      type: String,
      required: false,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);
reportSchema.index({ reporter: 1, reportedUser: 1 }, { unique: true });
module.exports = model("Report", reportSchema);
