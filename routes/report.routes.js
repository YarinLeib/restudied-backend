const express = require('express');
const Report = require('../models/Report.model');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const router = express.Router();

// POST /api/reports
router.post('/', isAuthenticated, async (req, res) => {
  const { reportedUserId, itemId, reason, message } = req.body;

  if (!reportedUserId || !itemId || !reason || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const report = await Report.create({
      reporter: req.payload._id,
      reportedUser: reportedUserId,
      itemId,
      reason,
      message,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reports/:reportId
router.get('/:reportId', isAuthenticated, async (req, res) => {
  const { reportId } = req.params;

  try {
    const report = await Report.findById(reportId)
      .populate('reporter', 'username')
      .populate('reportedUser', 'username')
      .populate('itemId');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reports/user/:userId
router.get('/user/:userId', isAuthenticated, async (req, res) => {
  const { userId } = req.params;

  try {
    const reports = await Report.find({ reportedUser: userId }).populate('reporter', 'username').populate('itemId');

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No reports found for this user.' });
    }

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/reports/:reportId
router.delete('/:reportId', isAuthenticated, async (req, res) => {
  const { reportId } = req.params;

  try {
    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.status(200).json({ message: 'Report deleted successfully.' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
