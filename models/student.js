const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  name:{type: String, required: true}, 
  email:{type: String, required: true}, 
  course:{type: String}, 
  institute: {type: String},
  imageUrl: {type: String},
  fee: {type: Number, default:0}
});

module.exports = mongoose.model("Student", studentSchema);
