const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    message: { type: String, maxlength: 1000 },
  },
  {
    timestamps: true,
  }
);
module.exports = model('Request', RequestSchema);
