// routes/institute.js
const express = require("express");
const Institute = require("../models/institute");

const router = express.Router();

// GET all institutes
router.get("/", async (req, res) => {
  try {
    const institutes = await Institute.find();
    res.json(institutes);
  } catch (error) {
    console.error("Error retrieving institutes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
