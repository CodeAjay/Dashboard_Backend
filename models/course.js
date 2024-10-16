const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseName:{type: String, required: true}, 
  imageUrl:{type: String},
  institute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institute",
    required: true
  },
  studentsEnrolled: {type: Number, default:0},
  totalFee: {type: Number, default:0}
});

module.exports = mongoose.model("Course", courseSchema);
