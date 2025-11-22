// const express = require("express");
// const router = express.Router();
// const Complaint = require("../models/Complaint");
// const jwt = require("jsonwebtoken");

// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// // Middleware to verify officer token
// const verifyOfficer = (req, res, next) => {
//     const authHeader = req.headers.authorization || "";

//     if (!authHeader.startsWith("Bearer ")) {
//         return res.json({ success: false, message: "No token provided" });
//     }

//     const token = authHeader.replace("Bearer ", "");

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);

//         if (decoded.role !== "officer") {
//             return res.json({ success: false, message: "Access denied" });
//         }

//         req.officer = decoded;
//         next();
//     } catch (err) {
//         return res.json({ success: false, message: "Invalid token" });
//     }
// };

// // ----------------------------------------------------
// // GET COMPLAINTS ASSIGNED TO OFFICER
// // ----------------------------------------------------
// router.get("/complaints", verifyOfficer, async (req, res) => {
//     try {
//         const { email } = req.officer;

//         // Find complaints where assignedEmail matches officer's email
//         const complaints = await Complaint.find({
//             assignedEmail: email
//         }).sort({ createdAt: -1 });

//         return res.json({
//             success: true,
//             data: complaints,
//             count: complaints.length
//         });
//     } catch (error) {
//         console.error("Error fetching officer complaints:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch complaints"
//         });
//     }
// });

// // ----------------------------------------------------
// // UPDATE COMPLAINT STATUS (Officer)
// // ----------------------------------------------------
// router.put("/complaints/:id/update", verifyOfficer, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status, resolutionNotes } = req.body;
//         const { email } = req.officer;

//         // Find complaint and verify it's assigned to this officer
//         const complaint = await Complaint.findById(id);

//         if (!complaint) {
//             return res.json({
//                 success: false,
//                 message: "Complaint not found"
//             });
//         }

//         if (complaint.assignedEmail !== email) {
//             return res.json({
//                 success: false,
//                 message: "You are not authorized to update this complaint"
//             });
//         }

//         // Update complaint
//         complaint.status = status || complaint.status;
//         if (resolutionNotes) {
//             complaint.resolutionNotes = resolutionNotes;
//         }
//         complaint.updatedAt = Date.now();

//         await complaint.save();

//         return res.json({
//             success: true,
//             message: "Complaint updated successfully",
//             data: complaint
//         });
//     } catch (error) {
//         console.error("Error updating complaint:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to update complaint"
//         });
//     }
// });

// module.exports = router;
