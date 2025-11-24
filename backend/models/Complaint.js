const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    complaintNumber: { type: String, required: true, unique: true, index: true },

    // Personal info
    personName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },

    // Address
    wardNumber: { type: Number, required: true, index: true },
    location: { type: String, required: true },
    address: { type: String, required: true },

    // Complaint details
    complaintType: { type: String, required: true, index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Emergency"],
      default: "Medium",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    incidentDate: { type: Date },

    // Files
    attachments: {
      type: [String],
      default: [],
    },

    // Admin
    status: {
      type: String,
      default: "Submitted",
      index: true,
    },
    assignedTo: { type: String, default: "" },
    assignedPhone: { type: String, default: "" },
    assignedEmail: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
    actionDate: { type: Date, default: null },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for admin dashboard filtering and sorting
ComplaintSchema.index({ status: 1, complaintType: 1, createdAt: -1 });
ComplaintSchema.index({ wardNumber: 1, status: 1 });

module.exports = mongoose.model("Complaint", ComplaintSchema);
