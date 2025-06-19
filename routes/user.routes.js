const express = require('express');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const User = require('../models/User.model');
const Item = require('../models/Item.model');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.payload._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:userId/items
router.get('/:userId/items', async (req, res) => {
  const { userId } = req.params;

  try {
    const items = await Item.find({ owner: userId }).populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', isAuthenticated, async (req, res) => {
  const { name, email, profileImage } = req.body;

  try {
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (profileImage) updates.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
      req.payload._id,
      updates,
      { name, email, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/users/profile
router.delete('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.payload._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export the router
module.exports = router;
