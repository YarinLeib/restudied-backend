const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5005;

app.get("/", (req, res) => {
  res.send("ReStudied backend is up and running.");
});

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/items", require("./routes/item.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/messages", require("./routes/messages.routes"));
app.use("/api/reports", require("./routes/report.routes"));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// CONNECT TO MONGODB AND START SERVER
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
