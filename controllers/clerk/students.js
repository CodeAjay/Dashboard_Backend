const Student = require("../../models/student");

exports.getStudents = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware
    // console.log(user, "user")
    // Check if the user is a clerk
    let query = {};
    if (user.role === "clerk") {
      query.institute_id = user.institute_id; // Filter by institute_id
    }

    // Retrieve students based on user role and populate related fields
    const students = await Student.find(query)
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
    const { user } = req; // Assuming user is attached to req by middleware
    // console.log(user)

    // Check if the user is a clerk and enforce institute_id
    if (user.role === "clerk") {
      req.body.institute_id = user.institute_id; // Set institute_id from the clerk's profile
    }

    const { name, email, course_id, institute_id, fee, imageUrl, mobile, fathersName, address, enrollment_date, fmobile,DOB } = req.body;

    // Check if a student with the same email or mobile already exists
    
    const existingStudent = await Student.findOne({email});

    if (existingStudent) {
      return res.status(400).json({ message: "A student with this email or mobile number already exists." });
    }
    
    const student = new Student({
      name,
      email,
      course_id,
      institute_id, // This can be optional for admins, but required for clerks
      fee,
      imageUrl,
      mobile,
      fathersName,
      address,
      enrollment_date,
      fmobile,DOB
    });

    await student.save();

    // Populate the institute_id and course_id after saving the student
    const populatedStudent = await Student.findById(student._id)
      .populate("institute_id")
      .populate("course_id");

    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: "Error adding student", error });
  }
};

exports.editStudents = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware
    const { id } = req.params;
    // console.log(user, "user after auth")
    // Check if the student belongs to the clerk's institute
    const student = await Student.findById(id);
    if (user.role === "clerk" && student.institute_id.toString() !== user.institute_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this student" });
    }

    const { name, email, institute_id, course_id, imageUrl, mobile, fathersName, address, enrollment_date,fmobile, DOB} = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        name,
        email,
        institute_id,
        course_id,
        imageUrl,
        mobile,
        fathersName,
        address,
        enrollment_date,
        fmobile,DOB
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    const populatedStudent = await Student.findById(updatedStudent._id)
      .populate("institute_id")
      .populate("course_id");

    res.status(200).json(populatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Error updating student", error });
  }
};

exports.deleteStudents = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware
    const { id } = req.params;

    // Check if the student belongs to the clerk's institute
    const student = await Student.findById(id);
    if (user.role === "clerk" && student.institute_id.toString() !== user.institute_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this student" });
    }

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully", deletedStudent });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student", error });
  }
};
