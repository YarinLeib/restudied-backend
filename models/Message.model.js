const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = model('Message', messageSchema);
