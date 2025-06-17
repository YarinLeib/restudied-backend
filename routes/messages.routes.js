const express = require('express');
const Message = require('../models/Message.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');

const router = express.Router();

// POST /api/messages
router.post('/', isAuthenticated, async (req, res) => {
  const { receiver, content, itemId } = req.body;

  if (!receiver || !content || !itemId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const newMessage = await Message.create({
      sender: req.payload._id,
      receiver,
      content,
      itemId,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/messages/my
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.payload._id }, { receiver: req.payload._id }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username')
      .populate('receiver', 'username')
      .populate('itemId', 'title');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching my messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/messages/:itemId
router.get('/:itemId', isAuthenticated, async (req, res) => {
  const { itemId } = req.params;

  try {
    const messages = await Message.find({ itemId })
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage')
      .sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this item.' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', isAuthenticated, async (req, res) => {
  const { messageId } = req.params;

  try {
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
