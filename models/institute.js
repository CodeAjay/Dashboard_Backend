// models/Institute.js
const mongoose = require("mongoose");

const InstituteSchema = new mongoose.Schema({
  institute_name: {
    type: String,
    required: true,
    unique: true
  },
  location: String,
});

const Institute = mongoose.model("Institute", InstituteSchema);
module.exports = Institute;
