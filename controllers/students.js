const Student = require("../models/student")

exports.getStudents=async (req, res)=>{
  try {
    const students = await Student.find().populate("institute_id course_id").sort({_id:-1});
    res.json(students);
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ message: "Server error" });
  }
}

exports.postStudents= async (req, res)=>{
    try{
        const {name, email, course, institute, fee, imageUrl}=req.body;
    
        // console.log(name, email, course, institute, fee, imageUrl)
        const student= new Student({
            name,
            email, 
            course, 
            institute, 
            fee, 
            imageUrl
        })

        await student.save();
        res.status(201).json(student);
        } catch(error){
            console.error('Error placing order:', error); // Log error
            res.status(500).json({ message: "Error placing order", error });
        }
}

exports.editStudents=async(req, res)=>{
    try {
        const { id } = req.params;
        const { name, email, institute, course, imageUrl } = req.body;
    
        const updatedStudent = await Student.findByIdAndUpdate(
          id,
          {
            name,
            email,
            institute,
            course,
            imageUrl,
          },
          { new: true }
        );
    
        if (!updatedStudent) {
          return res.status(404).json({ message: "Course not found" });
        }
    
        res.status(200).json({ message: "Course updated successfully", updatedStudent });
      } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Error updating course", error });
      }
}

exports.deleteStudents=async(req, res)=>{
    try {
        const { id } = req.params;
    
        const deletedStudent = await Student.findByIdAndDelete(id);
    
        if (!deletedStudent) {
          return res.status(404).json({ message: "Course not found" });
        }
    
        res.status(200).json({ message: "Course deleted successfully", deletedStudent });
      } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Error deleting course", error });
      }
}

