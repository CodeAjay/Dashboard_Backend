const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  title:{type: String, required: true}, 
  institute: {type: String},
  studentsEnrolled: {type: Number, default:0},
  fee: {type: Number, default:0}
});

module.exports = mongoose.model("Course", courseSchema);
