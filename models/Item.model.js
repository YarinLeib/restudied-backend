const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    itemDescription: {
      type: String,
      required: true,
    },
    itemLocation: {
      type: String,
      required: true,
    },
    itemCategory: {
      type: [{ type: String, enum: ['Books', 'Tech', 'Stationery', 'Clothing', 'Kitchen', 'Other'], required: true }],
    },
    itemImage: {
      type: String,
      required: true,
    },
    itemCondition: {
      type: String,
      enum: ['New', 'Like New', 'Used'],
      required: true,
    },
    itemLanguage: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.itemCategory.includes('Books')) {
            return !!v;
          }
          return true; // If not a book, no language is required
        },
        message: 'Language is required for books.',
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
