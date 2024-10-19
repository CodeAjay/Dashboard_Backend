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
    required: true,
    min: 0 // Ensure amount is not negative
  },
  payment_date: {
    type: Date,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  }
}, { timestamps: true });

const FeeCollection = mongoose.model("FeeCollection", FeeCollectionSchema);
module.exports = FeeCollection;
