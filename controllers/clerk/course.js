const Course = require("../../models/course");
const Student = require('../../models/student');

exports.getCourses = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware

    let query = {};
    // If the user is a clerk, filter courses by their institute_id
    if (user.role === "clerk") {
      query.institute_id = user.institute_id;
    }

    // Retrieve courses based on user role and populate related fields
    const courses = await Course.find(query).populate('institute_id', 'institute_name').sort({ _id: -1 });

    // Count students for each course
    const studentCounts = await Student.aggregate([
      {
        $group: {
          _id: "$course_id",
          count: { $sum: 1 },
        },
      },
    ]);

    // Map the student counts to their respective courses
    const coursesWithCount = courses.map(course => {
      const studentCount = studentCounts.find(sc => sc._id.toString() === course._id.toString());
      return {
        ...course._doc,
        studentsEnrolled: studentCount ? studentCount.count : 0,
      };
    });

    res.status(200).json(coursesWithCount);
  } catch (error) {
    console.error("Error fetching courses with student count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.postCourses = async (req, res) => {
  try {
    const { user } = req;

    // For clerks, enforce their institute_id when creating a course
    if (user.role === "clerk") {
      req.body.institute_id = user.institute_id;
    }

    const { courseName, imageUrl, institute_id, studentsEnrolled, totalFee, course_duration ,admission_fee} = req.body;

    const newCourse = new Course({
      courseName,
      imageUrl,
      institute_id,
      studentsEnrolled,
      totalFee,
      course_duration,
      admission_fee
    });

    await newCourse.save();

    const populatedCourse = await Course.findById(newCourse._id).populate("institute_id");

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course", error });
  }
};

exports.editCourse = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Check if the course belongs to the clerk's institute
    const course = await Course.findById(id);
    if (user.role === "clerk" && course.institute_id.toString() !== user.institute_id) {
      return res.status(403).json({ message: "Unauthorized to edit this course" });
    }

    const { courseName, imageUrl, institute_id, studentsEnrolled, totalFee, course_duration } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        courseName,
        imageUrl,
        institute_id,
        studentsEnrolled,
        totalFee,
        course_duration,
      },
      { new: true } // Return the updated document
    ).populate("institute_id", "institute_name");

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course updated successfully", updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course", error });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Check if the course belongs to the clerk's institute
    const course = await Course.findById(id);
    if (user.role === "clerk" && course.institute_id.toString() !== user.institute_id) {
      return res.status(403).json({ message: "Unauthorized to delete this course" });
    }

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully", deletedCourse });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error });
  }
};
