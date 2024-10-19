const Student = require('../../models/student');
const Announcement = require('../../models/announcement');
const FeeCollection = require('../../models/feeCollection');
const moment = require('moment');


// Get course details, including fees and payments
exports.getStudentCourseDetails = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Find the student along with their course details
    const student = await Student.findById(studentId).populate('course_id');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const course = student.course_id;

    // Validate and parse the enrollment date
    const enrollmentDate = moment(student.enrollmentDate);
    if (!enrollmentDate.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment date' });
    }

    // Calculate the course's end date based on the enrollment date and course duration
    const endDate = enrollmentDate.clone().add(course.course_duration, 'months');

    // Find fee collections between enrollment date and course end date
    const feeCollections = await FeeCollection.find({
      student_id: studentId,
      course_id: course._id,
      payment_date: { $gte: enrollmentDate.toDate(), $lte: endDate.toDate() } // Use valid Date objects
    });

    // Calculate the total paid fee during this period
    const totalPaid = feeCollections.reduce((acc, fee) => acc + fee.amount_paid, 0);

    // Total and pending fee
    const totalFee = course.totalFee;
    const pendingFee = totalFee - totalPaid;
    const courseDetails= {
        courseName: course.courseName,
        totalFee: totalFee,
        paidFee: totalPaid,
        pendingFee: pendingFee,
        enrollmentDate: enrollmentDate.toDate(),
        courseEndDate: endDate.toDate()
      }
    res.json(courseDetails);

  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




// Get past payments for a student within the enrollment period
// Get past payments for a student within the enrollment period
exports.getStudentPastPayments = async (req, res) => {
    const { studentId } = req.params;
  
    try {
      // Find the student and ensure they are enrolled in a course
      const student = await Student.findById(studentId).populate('course_id');
      
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
  
      const course = student.course_id;
  
      // Use moment to parse and validate enrollment date
      const enrollmentDate = moment(student.enrollment_date);
      if (!enrollmentDate.isValid()) {
        return res.status(400).json({ success: false, message: 'Invalid enrollment date' });
      }
  
      // Calculate end date based on course duration
      const endDate = enrollmentDate.clone().add(course.course_duration, 'months');
  
      // Log the dates for debugging
      console.log('Enrollment Date:', enrollmentDate.format());
      console.log('End Date:', endDate.format());
  
      // Find all fee collections for this student between the enrollment and course end dates
      const feeCollections = await FeeCollection.find({
        student_id: studentId,
        course_id: course._id,
        payment_date: { $gte: enrollmentDate.toDate(), $lte: endDate.toDate() } // Convert moment objects to Date
      });

      console.log(feeCollections)
  
      res.json({
        success: true,
        payments: feeCollections.map(payment => ({
          amountPaid: payment.amount_paid,
          paymentDate: moment(payment.payment_date).format('YYYY-MM-DD'), // Format the date
          paymentMethod: payment.payment_method
        }))
      });
  
    } catch (error) {
      console.error("Error fetching fee payments:", error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  




// Get course announcements for a student
exports.getStudentAnnouncements = async (req, res) => {
//   const { studentId } = req.params;

  try {
    // Find the student to get their course and institute
    // const student = await Student.findById(studentId).populate('course_id institute_id');

    // if (!student) {
    //   return res.status(404).json({ success: false, message: 'Student not found' });
    // }

    // Fetch announcements based on the student's course and institute
    const announcements = await Announcement.find();

    res.json(announcements);

  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
