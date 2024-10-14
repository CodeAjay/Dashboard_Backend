const mongoose = require("mongoose");

// Load environment variables from a .env file if it exists
require("dotenv").config();

// Replace with your MongoDB connection string
const mongoURI =
  process.env.DBURL

mongoose.connect(mongoURI, {
  useNewUrlParser: true, // Optional, can be removed
  useUnifiedTopology: true, // Optional, can be removed  
  writeConcern: {
    w: 'majority',
    wtimeout: 1000  // Adjust this timeout as needed
  }
})

const db = mongoose.connection;

db.on("connected", () => {
  console.log("MongoDB connected successfully");
});

db.on("error", (error) => {
  console.error("Error connecting to MongoDB:", error);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

module.exports = db;
