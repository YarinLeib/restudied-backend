const express = require('express');
const Review = require('../models/Review.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// POST /api/reviews
router.post('/', isAuthenticated, async (req, res) => {
  const { reviewee, rating, comment } = req.body;
  const reviewer = req.payload._id;

  if (!reviewee || typeof rating !== 'number' || comment === undefined) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (reviewer.toString() === reviewee.toString()) {
    return res.status(400).json({ message: 'You cannot review yourself.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  const existing = await Review.findOne({ reviewer, reviewee });
  if (existing) {
    return res.status(400).json({ message: 'You already reviewed this user.' });
  }

  try {
    const newReview = await Review.create({
      reviewer,
      reviewee,
      rating,
      comment,
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reviews/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reviews/reviewed/:userId
router.get('/reviewed/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const reviews = await Review.find({ reviewer: userId })
      .populate('reviewee', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews by reviewer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reviews/average/:userId
router.get('/average/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$reviewee', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (result.length === 0) return res.status(404).json({ avgRating: null, count: 0 });
    res.json(result[0]);
  } catch (error) {
    console.error('Error calculating average:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', isAuthenticated, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }
    if (review.reviewer.toString() !== req.payload._id) {
      return res.status(403).json({ message: 'You can only delete your own reviews.' });
    }
    await Review.findByIdAndDelete(reviewId);
    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
