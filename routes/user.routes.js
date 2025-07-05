const express = require("express");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const User = require("../models/User.model");
const Item = require("../models/Item.model");

const router = express.Router();
// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// GET /api/users/profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.payload._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users/:userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users/:userId/items
router.get("/:userId/items", async (req, res) => {
  const { userId } = req.params;

  try {
    const items = await Item.find({ owner: userId }).populate(
      "owner",
      "username"
    );
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching user items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/users/profile
router.put("/profile", isAuthenticated, async (req, res) => {
  const { name, email, profileImage, username, newPassword } = req.body;

  try {
    const user = await User.findById(req.payload._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) {
      const originalUsername = username.trim();
      const lowercaseUsername = originalUsername.toLowerCase();

      const existing = await User.findOne({ usernameLower: lowercaseUsername });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username is already taken." });
      }

      user.username = originalUsername;
      user.usernameLower = lowercaseUsername;
    }

    if (name) user.name = name;
    if (email) {
      const existingEmailUser = await User.findOne({
        email,
        _id: { $ne: req.payload._id },
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email;
    }
    if (profileImage) user.profileImage = profileImage;

    if (newPassword) {
      const bcrypt = require("bcrypt");
      const saltRounds = 10;
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      user.password = hashed;
    }

    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/users/profile
router.delete("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.payload._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export the router
module.exports = router;
