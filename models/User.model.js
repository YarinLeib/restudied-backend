const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    profileImage: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
