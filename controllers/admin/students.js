const Student = require("../../models/student")

exports.getStudents = async (req, res) => {
  try {
    // Retrieve students and populate related fields
    const students = await Student.find()
      .populate("institute_id") // Populate institute details
      .populate("course_id") // Populate course details
      .sort({ _id: -1 }); // Sort by newest first

    res.status(200).json(students);
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.postStudents = async (req, res) => {
  try {
      const { name, email, course_id, institute_id, fee, imageUrl, mobile, fathersName, address, enrollment_date,fmobile } = req.body;

    // Check if a student with the same email or mobile already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingStudent) {
      return res.status(400).json({ message: "A student with this email or mobile number already exists." });
    }

      const student = new Student({
          name,
          email,
          course_id,
          institute_id,
          fee,
          imageUrl,
          mobile, fathersName,
          address,enrollment_date,fmobile
      });

      await student.save();

      // Populate the institute_id and course_id after saving the student
      const populatedStudent = await Student.findById(student._id)
          .populate("institute_id")
          .populate("course_id");

      res.status(201).json(populatedStudent);
  } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ message: "Error placing order", error });
  }
};


exports.editStudents=async(req, res)=>{
    try {
        const { id } = req.params;
        const { name, email, institute_id, course_id, imageUrl, mobile, fathersName, address, enrollment_date,fmobile} = req.body;
    
        const updatedStudent = await Student.findByIdAndUpdate(
          id,
          {
            name,
            email,
            institute_id,
            course_id,
            imageUrl,
            mobile, fathersName,
            address,enrollment_date,fmobile
          },
          { new: true }
        );
    
        if (!updatedStudent) {
          return res.status(404).json({ message: "Student not found" });
        }

        const populatedstudent = await Student.findById(updatedStudent._id)
        .populate("institute_id")
        .populate("course_id");
    
        res.status(200).json( populatedstudent );
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

