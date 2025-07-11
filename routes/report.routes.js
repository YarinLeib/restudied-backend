const express = require("express");
const router = express.Router();
const Report = require("../models/Report.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const isAdmin = require("../middleware/isAdmin");

// POST /api/reports — anyone authenticated can report a user
router.post("/", isAuthenticated, async (req, res) => {
  const { reportedUser, reason, message } = req.body;

  if (!reportedUser || !reason) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (req.payload._id === reportedUser) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  try {
    const existingReport = await Report.findOne({
      reporter: req.payload._id,
      reportedUser,
    });

    if (existingReport) {
      return res.status(400).json({
        message: "You have already reported this user.",
      });
    }

    const report = await Report.create({
      reporter: req.payload._id,
      reportedUser,
      reason,
      message: message || "",
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/reports — admin only, all reports
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "username")
      .populate("reportedUser", "username");

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/reports/:reportId — admin only, single report
router.get("/:reportId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate("reporter", "username")
      .populate("reportedUser", "username");

    if (!report) return res.status(404).json({ message: "Report not found." });

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/reports/user/:userId — admin only, all reports for a user
router.get("/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find({ reportedUser: req.params.userId })
      .populate("reporter", "username")
      .populate("reportedUser", "username");

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/reports/:reportId — admin only, delete a report
router.delete("/:reportId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.reportId);
    if (!deleted) return res.status(404).json({ message: "Report not found." });

    res.status(200).json({ message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
