const Course = require("../models/course");
const Student = require('../models/student');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('institute_id', 'institute_name');

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
    const { courseName,imageUrl, institute_id, studentsEnrolled, totalFee } = req.body;

    const newCourse = new Course({
      courseName,
      imageUrl, 
      institute_id,
      studentsEnrolled,
      totalFee,
    });

    await newCourse.save();

    // Populate the institute_id and course_id after saving the student
    const populatedCourse = await Course.findById(newCourse._id)
    .populate("institute_id")

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course", error });
  }
};

exports.editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, imageUrl, institute_id, studentsEnrolled, totalFee } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        courseName,
        imageUrl,
        institute_id,
        studentsEnrolled,
        totalFee,
      },
      { new: true } // Return the updated document
    ).populate("institute_id", "institute_name"); // Populate the institute name

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
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully", deletedCourse });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error });

}
}

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the request parameters

    // Find the announcement by ID and delete it
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json({ message: "Announcement deleted successfully", deletedCourse });
  } catch (error) {
    console.error('Error deleting announcement:', error); // Log error
    res.status(500).json({ message: "Error deleting announcement", error });
  }
}
