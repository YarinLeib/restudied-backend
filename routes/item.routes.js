const express = require('express');
const router = express.Router();
const Item = require('../models/Item.model');
const { isAuthenticated } = require('../middleware/jwt.middleware');
const upload = require('../middleware/cloudinary.middleware');

// POST /api/items
router.post('/', isAuthenticated, upload.single('itemImage'), async (req, res) => {
  const { title, itemDescription, itemLocation, itemCategory, itemCondition, itemLanguage } = req.body;
  const itemImage = req.file?.path;
  const ownerId = req.payload._id;

  try {
    const newItem = await Item.create({
      title,
      itemDescription,
      itemLocation,
      itemCategory,
      itemImage,
      itemCondition,
      itemLanguage,
      owner: ownerId,
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get items by title
router.get('/title/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const items = await Item.find({ title: new RegExp(title, 'i') }).populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items by title:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get items by category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;

  try {
    const items = await Item.find({ itemCategory: category }).populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get items by location
router.get('/location/:location', async (req, res) => {
  const { location } = req.params;

  try {
    const items = await Item.find({ itemLocation: location }).populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items by location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get my items
router.get('/my-items', isAuthenticated, async (req, res) => {
  const ownerId = req.payload._id;

  try {
    const items = await Item.find({ owner: ownerId }).populate('owner', 'username');
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching my items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id).populate('owner', 'username');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update item by ID
router.put('/:id', isAuthenticated, upload.single('itemImage'), async (req, res) => {
  const { id } = req.params;
  const { title, itemDescription, itemLocation, itemCategory, itemCondition, itemLanguage } = req.body;
  const itemImage = req.file?.path;

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.owner.toString() !== req.payload._id) {
      return res.status(403).json({ message: 'Unauthorized to edit this item' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        title,
        itemDescription,
        itemLocation,
        itemCategory,
        itemImage: itemImage || item.itemImage,
        itemCondition,
        itemLanguage,
      },
      { new: true }
    ).populate('owner', 'username');

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete item by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.owner.toString() !== req.payload._id) {
      return res.status(403).json({ message: 'Unauthorized to delete this item' });
    }

    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
