const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const upload = require("../middleware/cloudinary.middleware");
const saltRounds = 10;

// POST /api/auth/signup
router.post("/signup", upload.single("profileImage"), async (req, res) => {
  console.log("BODY:", req.body);
  const { email, password, name, username } = req.body;
  const profileImage = req.file?.path;
  const originalUsername = req.body.username?.trim();
  const lowercaseUsername = originalUsername?.toLowerCase();

  if (!email || !password || !name || !username) {
    return res
      .status(400)
      .json({ message: "Provide username, name, email, and password" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });

    return;
  }
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
  }
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const existingUsername = await User.findOne({
      usernameLower: lowercaseUsername,
    });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken." });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const userData = {
      email,
      password: hashedPassword,
      name,
      username,
      usernameLower: lowercaseUsername,
    };

    if (profileImage) {
      userData.profileImage = profileImage;
    }

    const createdUser = await User.create(userData);

    const {
      _id,
      email: userEmail,
      name: userName,
      username: userUsername,
      profileImage: userProfileImage,
    } = createdUser;
    res.status(201).json({
      user: {
        _id,
        email: userEmail,
        name: userName,
        username: userUsername,
        profileImage: userProfileImage,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Provide email and password" });
  }

  try {
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Server Error" });
    }

    const payload = {
      _id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin,
    };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({ authToken, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/auth/verify
router.get("/verify", isAuthenticated, (req, res) => {
  const { _id, email, name, username, profileImage, isAdmin } = req.payload;

  res.status(200).json({
    user: {
      _id,
      email,
      name,
      username,
      profileImage,
      isAdmin,
    },
  });
});
// GET /api/auth/profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.payload._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// PUT /api/auth/profile
router.put(
  "/profile",
  isAuthenticated,
  upload.single("profileImage"),
  async (req, res) => {
    const { name, username, password } = req.body;
    const profileImage = req.file?.path;

    console.log("Profile update - req.file:", req.file);
    console.log("Profile update - profileImage:", profileImage);

    try {
      // Get the current user to preserve existing profileImage if no new one is uploaded
      const currentUser = await User.findById(req.payload._id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = {};
      if (name) updates.name = name;
      if (typeof username === "string") {
        const trimmedUsername = username.trim();
        const lowercaseUsername = trimmedUsername.toLowerCase();

        const existingUser = await User.findOne({
          usernameLower: lowercaseUsername,
          _id: { $ne: req.payload._id },
        });

        if (existingUser) {
          return res.status(400).json({ message: "Username already taken." });
        }

        updates.username = trimmedUsername;
        updates.usernameLower = lowercaseUsername;
      }
      // Handle profileImage exactly like items - keep existing if no new one uploaded
      if (profileImage) {
        updates.profileImage = profileImage;
      } else if (currentUser.profileImage) {
        updates.profileImage = currentUser.profileImage;
      }

      if (password) {
        const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
        if (!passwordRegex.test(password)) {
          return res.status(400).json({
            message:
              "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
          });
        }
        const salt = bcrypt.genSaltSync(10);
        updates.password = bcrypt.hashSync(password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.payload._id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Updated user profileImage:", updatedUser.profileImage);
      res.status(200).json(updatedUser);
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);
// DELETE /api/auth/profile
router.delete("/profile", isAuthenticated, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.payload._id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Profile deletion error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
