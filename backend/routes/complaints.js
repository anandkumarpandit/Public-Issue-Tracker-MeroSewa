const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Complaint = require("../models/Complaint");

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "complaints",
    resource_type: "auto", // Allow other file types like PDF
    // allowed_formats: ["jpg", "png", "jpeg", "pdf"], // Remove strict format check for now to test
  },
});

const upload = multer({ storage });


// -------------------------------------------------
// NORMAL COMPLAINT SUBMIT
// -------------------------------------------------
router.post("/submit", upload.array("attachments", 5), async (req, res) => {
  try {
    const {
      personName,
      phone,
      email,
      wardNumber,
      location,
      address,
      complaintType,
      priority,
      title,
      description,
      incidentDate,
    } = req.body;

    const complaint = new Complaint({
      personName,
      phone,
      email,
      wardNumber,
      location,
      address,
      complaintType,
      priority,
      title,
      description,
      incidentDate,
      attachments: (req.files || []).map((f) => f.path), // Save Cloudinary URL
      complaintNumber: "CMP" + Math.floor(100000 + Math.random() * 900000),
      status: "Submitted",
    });

    await complaint.save();

    res.json({ success: true, data: complaint });
  } catch (err) {
    console.log("❌ Submit Error:", err);
    res.status(500).json({ success: false, message: "Failed to submit complaint" });
  }
});


// -------------------------------------------------
// QR SUBMISSION
// -------------------------------------------------
router.post("/qr/submit", async (req, res) => {
  try {
    let qrData = req.body.qrData;

    if (typeof qrData === "string") {
      try {
        qrData = JSON.parse(qrData);
      } catch {
        qrData = {};
      }
    }

    const location = qrData?.location || req.body.location;
    const wardNumber = qrData?.wardNumber || req.body.wardNumber;

    const { personName, phone, email, address, complaintType, priority, title, description, incidentDate } =
      req.body;

    if (!personName || !phone || !address || !complaintType || !title || !description || !location || !wardNumber) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const complaint = new Complaint({
      personName,
      phone,
      email,
      address,
      complaintType,
      priority,
      title,
      description,
      incidentDate,
      location,
      wardNumber,
      attachments: [],
      complaintNumber: "CMP" + Math.floor(100000 + Math.random() * 900000),
      status: "Submitted",
    });

    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch (err) {
    console.log("❌ QR Submit Error:", err);
    res.json({ success: false, message: "QR submission failed" });
  }
});


// -------------------------------------------------
// TRACK COMPLAINT
// -------------------------------------------------
router.get("/track/:complaintNumber", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      complaintNumber: req.params.complaintNumber,
    });

    if (!complaint) return res.json({ success: false, message: "Not found" });

    res.json({ success: true, data: complaint });
  } catch {
    res.json({ success: false, message: "Error tracking complaint" });
  }
});


// -------------------------------------------------
// ADMIN GET ALL (With Pagination & Filtering)
// -------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.complaintType) query.complaintType = req.query.complaintType;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.wardNumber) query.wardNumber = req.query.wardNumber;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        current: page,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get Complaints Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
});


// -------------------------------------------------
// STATS OVERVIEW
// -------------------------------------------------
router.get("/stats/overview", async (req, res) => {
  try {
    const total = await Complaint.countDocuments();

    const byStatus = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byType = await Complaint.aggregate([
      { $group: { _id: "$complaintType", count: { $sum: 1 } } },
    ]);

    const byPriority = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        byType,
        byPriority,
      },
    });
  } catch (err) {
    console.error("❌ Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});


// -------------------------------------------------
// ADMIN UPDATE STATUS
// -------------------------------------------------
router.patch("/:id/status", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.json({ success: false, message: "Not found" });

    const { status, assignedTo, assignedPhone, assignedEmail, resolutionNotes } = req.body;

    complaint.status = status || complaint.status;
    complaint.assignedTo = assignedTo;
    complaint.assignedPhone = assignedPhone;
    complaint.assignedEmail = assignedEmail;
    complaint.resolutionNotes = resolutionNotes;
    complaint.lastUpdated = new Date();

    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch {
    res.json({ success: false, message: "Cannot update complaint" });
  }
});

module.exports = router;
