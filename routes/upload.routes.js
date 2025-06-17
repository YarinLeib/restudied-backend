const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const path = require('path');
const fs = require('fs');

// POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// GET /api/upload
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Upload endpoint is working' });
});

// GET /api/upload/:filename
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File not found:', err);
      res.status(404).json({ message: 'File not found' });
    }
  });
});

// DELETE /api/upload/:filename
router.delete('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('File deletion error:', err);
      return res.status(500).json({ message: 'Error deleting file' });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  });
});

module.exports = router;
