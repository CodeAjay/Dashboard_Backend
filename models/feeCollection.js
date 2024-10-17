const mongoose = require("mongoose");

const FeeCollectionSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  amount_paid: {
    type: Number,
    required: true
  },
  payment_date: {
    type: Date,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  }
});

const FeeCollection = mongoose.model("FeeCollection", FeeCollectionSchema);
module.exports = FeeCollection;
