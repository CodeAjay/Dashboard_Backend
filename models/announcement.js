const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const announcementSchema = new Schema({
  title:{type: String, required: true}, 
  description: {type: String, required: true},
<<<<<<< HEAD
  date: { type: Date, required: true },
  time: { type: String },
=======
  date: { type: String, required: true },
  time: { type: String, required: true },
>>>>>>> b82a7f36c33a593168df55dca65555cc27aab09a
});

module.exports = mongoose.model("Announcements", announcementSchema);
