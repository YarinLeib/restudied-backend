const express = require('express');
const router = express.Router();
const Report = require('../models/Report.model');
const Item = require('../models/Item.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const isAdmin = require('../middleware/isAdmin');

// POST /api/reports — anyone authenticated can report
router.post('/', isAuthenticated, async (req, res) => {
  const { reportedUserId, itemId, reason, message } = req.body;

  if (!reportedUserId || !itemId || !reason || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (req.payload._id === reportedUserId) {
    return res.status(400).json({ message: 'You cannot report yourself.' });
  }

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.owner.toString() === req.payload._id) {
      return res.status(400).json({ message: 'You cannot report someone for your own item.' });
    }

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

// GET /api/reports/:reportId — admin only
router.get('/:reportId', isAuthenticated, isAdmin, async (req, res) => {
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

// GET /api/reports/user/:userId — admin only
router.get('/user/:userId', isAuthenticated, isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const reports = await Report.find({ reportedUser: userId }).populate('reporter', 'username').populate('itemId');

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reports/item/:itemId — admin only
router.get('/item/:itemId', isAuthenticated, isAdmin, async (req, res) => {
  const { itemId } = req.params;

  try {
    const reports = await Report.find({ itemId }).populate('reporter', 'username').populate('reportedUser', 'username');

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching item reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/reports/:reportId — admin only
router.delete('/:reportId', isAuthenticated, isAdmin, async (req, res) => {
  const { reportId } = req.params;

  try {
    const deletedReport = await Report.findByIdAndDelete(reportId);

    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.status(200).json({ message: 'Report deleted successfully.' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
