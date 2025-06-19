const express = require('express');
const Request = require('../models/Request.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const router = express.Router();
const Item = require('../models/Item.model');

// POST /api/requests
router.post('/', isAuthenticated, async (req, res) => {
  const { requestee, itemId, message } = req.body;
  const requesterId = req.payload._id;

  if (!requestee || !itemId) {
    return res.status(400).json({ message: 'Requestee ID and Item ID are required.' });
  }
  if (req.payload._id === requestee) {
    return res.status(400).json({ message: 'You cannot request your own item.' });
  }
  const item = await Item.findById(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found.' });
  }

  if (item.owner.toString() !== requestee) {
    return res.status(400).json({ message: 'This item does not belong to the user you are requesting from.' });
  }
  try {
    const newRequest = await Request.create({
      requester: requesterId,
      requestee: requestee,
      itemId,
      message,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/requests
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const requests = await Request.find({ requestee: req.payload._id })
      .populate('requester', 'username profileImage')
      .populate('itemId', 'title itemImage');

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/requests/sent
router.get('/sent', isAuthenticated, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.payload._id })
      .populate('requestee', 'username profileImage')
      .populate('itemId', 'title itemImage');

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/requests/:requestId
router.delete('/:requestId', isAuthenticated, async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.requestee.toString() === req.payload._id) {
      return res.status(403).json({ message: 'Only the requestee can delete the request.' });
    }

    await Request.findByIdAndDelete(requestId);
    res.status(200).json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/requests/:requestId/accept
router.put('/:requestId/accept', isAuthenticated, async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    if (request.requestee.toString() !== req.payload._id) {
      return res.status(403).json({ message: 'You can only accept requests sent to you.' });
    }
    request.status = 'accepted';
    await request.save();
    res.status(200).json({ message: 'Request accepted successfully.', request });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// PUT /api/requests/:requestId/reject
router.put('/:requestId/reject', isAuthenticated, async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    if (request.requestee.toString() !== req.payload._id) {
      return res.status(403).json({ message: 'You can only reject requests sent to you.' });
    }
    request.status = 'declined';
    await request.save();
    res.status(200).json({ message: 'Request rejected successfully.', request });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// GET /api/requests/:requestId
router.get('/:requestId', isAuthenticated, async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Request.findById(requestId)
      .populate('requester', 'username profileImage')
      .populate('requestee', 'username profileImage')
      .populate('itemId', 'title itemImage');
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// GET /api/requests/user/:userId
router.get('/user/:userId', isAuthenticated, async (req, res) => {
  const { userId } = req.params;

  try {
    const requests = await Request.find({
      $or: [{ requester: userId }, { requestee: userId }],
    })
      .populate('requester', 'username profileImage')
      .populate('requestee', 'username profileImage')
      .populate('itemId', 'title itemImage');

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;
