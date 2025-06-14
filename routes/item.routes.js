const express = require('express');
const router = express.Router();
const Item = require('../models/Item.model'); // adjust path as needed

// Test route: create dummy item
router.get('/test-create', async (req, res) => {
  try {
    const item = await Item.create({
      title: 'Test Item',
      description: 'Just testing MongoDB Atlas',
      category: 'Other',
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create test item', error: err });
  }
});

module.exports = router;
