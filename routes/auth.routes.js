const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const saltRounds = 10;

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name, profileImage } = req.body;

  if (!email || !password || !name || !username) {
    return res.status(400).json({ message: 'Provide email, password, name, and username' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Provide a valid email address.' });

    return;
  }
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.',
    });
  }
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email,
      password: hashedPassword,
      name,
      username,
      profileImage: profileImage || '',
    });

    const { _id } = createdUser;
    res.status(201).json({ user: { _id, email, name, username, profileImage } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { _id: user._id, email: user.email, name: user.name, username: user.username };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '6h' });

    res.status(200).json({ authToken, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/auth/verify
router.get('/verify', isAuthenticated, (req, res) => {
  const { _id, email, name, username } = req.payload;
  res.status(200).json({ user: { _id, email, name, username } });
});
// GET /api/auth/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.payload._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// PUT /api/auth/profile
router.put('/profile', isAuthenticated, async (req, res) => {
  const { name, username, profileImage } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.payload._id,
      { name, username, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// DELETE /api/auth/profile
router.delete('/profile', isAuthenticated, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.payload._id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Profile deletion error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
module.exports = router;
