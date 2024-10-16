const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const announcementSchema = new Schema({
  title:{type: String, required: true}, 
  description: {type: String, required: true},
  date: { type: Date, required: true },
  time: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
});

module.exports = mongoose.model("Announcements", announcementSchema);
