const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const enquirySchema = new Schema({
  name:{type: String, required: true}, 
  fathersName: {type: String},
  mobile: Number,
  DOB: String,
  address: String,
  fmobile: Number,
  email:{type: String, required: true, unique: true}, 
  imageUrl: {type: String},
  institute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institute",
    required: true
  },
  course_id: { // Add this line to reference the Course model
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  enquiry_date: { type: Date},
  converted: {type: Boolean, default: false},
  converted_on: {type: Date, default: null}
});

module.exports = mongoose.model("Enquiry", enquirySchema);
