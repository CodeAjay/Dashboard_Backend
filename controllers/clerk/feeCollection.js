
const FeeCollection = require("../../models/feeCollection")
const Student = require("../../models/student");
const moment = require('moment'); // For date format changing

exports.getFeeCollection = async (req, res) => {
  try {
    const { from, to } = req.body;
    const clerkInstituteId = req.user.institute_id; // Assuming institute_id is available in the logged-in user's session or token

    // Check if the dates are provided, else default to last 12 months
    const toDate = to
      ? moment(to, ['DD-MM-YYYY', 'YYYY-MM-DD']).endOf('day').toDate()
      : new Date();

    const fromDate = from
      ? moment(from, ['DD-MM-YYYY', 'YYYY-MM-DD']).toDate()
      : moment(toDate).subtract(12, 'months').toDate();

    // Aggregation pipeline to get all payments with student details
    const result = await FeeCollection.aggregate([
      {
        $match: {
          payment_date: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student_id',
          foreignField: '_id',
          as: 'student_details',
        },
      },
      {
        $unwind: '$student_details'
      },
      {
        $match: {
          'student_details.institute_id': clerkInstituteId, // Filter by clerk's institute
        },
      },
      {
        $project: {
          studentId: "$student_id",
          studentName: { $concat: ["$student_details.firstName", " ", "$student_details.lastName"] },
          amountPaid: "$amount_paid",
          paymentDate: "$payment_date",
          paymentMethod: "$payment_method",
        },
      },
      {
        $sort: { paymentDate: 1 }, // Sort by payment date in ascending order
      },
    ]);

    res.json({
      feeCollections: result,
    });
  } catch (error) {
    console.error("Error retrieving fee collection:", error);
    res.status(500).json({ message: "Server error" });
  }
};





// GET /api/fee-collection/payment-status/:month
exports.getFeeCollectionById = async (req, res) => {
  const month = req.params.month;
  const clerkInstituteId = req.user.institute_id; // Assume institute_id comes from logged-in user

  try {
    const dateParts = month.split('-');
    const year = parseInt(dateParts[0], 10);
    const mon = parseInt(dateParts[1], 10);

    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0);

    const enStartDate = new Date(year - 1, mon - 1, 1);

    // Fetch students of the clerk's institute
    const students = await Student.find({
      enrollment_date: { $gte: enStartDate, $lte: endDate },
      institute_id: clerkInstituteId, // Filter students by the clerk's institute
    }).populate("institute_id course_id");

    const feeCollections = await FeeCollection.find({
      payment_date: {
        $gte: startDate,
        $lt: endDate
      },
    }).populate("student_id");

    const paidStudentIds = new Set(
      feeCollections.filter(fee => fee.student_id)
        .map(fee => fee.student_id._id.toString())
    );

    const notPaidStudents = [];

    students.forEach(student => {
      if (!paidStudentIds.has(student._id.toString())) {
        const course = student.course_id;
        const enrollmentDate = new Date(student.enrollment_date);
        const monthsEnrolled = Math.floor((endDate - enrollmentDate) / (1000 * 60 * 60 * 24 * 30));
        const totalFeeDue = Math.min(monthsEnrolled, course.course_duration) * (course.totalFee / course.course_duration);
        const pendingFee = totalFeeDue - student.fee;

        if (pendingFee > 0) {
          notPaidStudents.push({ student, pendingFee });
        }
      }
    });

    notPaidStudents.sort((a, b) => b.pendingFee - a.pendingFee);
    res.json(notPaidStudents);
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Create a new fee collection entry
exports.createFeeCollection = async (req, res) => {
  try {
    const { student_id, course_id, amount_paid, payment_date, payment_method } = req.body;
    const clerkInstituteId = req.user.institute_id; // Assuming req.user contains the logged-in clerk's info

    // Check if all required fields are provided
    if (!student_id || !course_id || !amount_paid || !payment_date || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: student_id, course_id, amount_paid, payment_date, payment_method"
      });
    }

    // Normalize the payment_date format
    const dateParts = payment_date.split('-');
    if (dateParts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment_date format. Please provide a valid date in YYYY-MM-DD format."
      });
    }

    // Pad month and day with leading zeros if needed
    const year = dateParts[0];
    const month = String(dateParts[1]).padStart(2, '0'); // Ensure two digits
    const day = String(dateParts[2]).padStart(2, '0'); // Ensure two digits

    const normalizedDate = `${year}-${month}-${day}`;

    // Validate payment_date using moment
    const formattedPaymentDate = moment(normalizedDate, "YYYY-MM-DD", true);
    if (!formattedPaymentDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment_date format. Please provide a valid date."
      });
    }

    // Find the student and populate the course and institute data
    const student = await Student.findById(student_id)
      .populate("course_id")
      .populate("institute_id");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Ensure the clerk can only add fee collection for students in their institute
    if (student.institute_id._id.toString() !== clerkInstituteId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add fees for students outside your institute."
      });
    }

    // Calculate course end date based on enrollment date and course duration
    const courseEndDate = moment(student.enrollment_date).add(student.course_id.course_duration, 'months');

    // Ensure payment_date is within the enrollment and course end date range
    if (formattedPaymentDate.isBefore(moment(student.enrollment_date)) || formattedPaymentDate.isAfter(courseEndDate)) {
      return res.status(400).json({
        success: false,
        message: `Payment date must be between ${moment(student.enrollment_date).toISOString()} and ${courseEndDate.toISOString()}.`
      });
    } else if (course_id !== student.course_id._id.toString()) { // Ensure comparison is made with string
      return res.status(400).json({ success: false, message: "Payment can only be made for the student's enrolled course." });
    }

    // Check if a payment has already been made for the same month
    const existingPayment = await FeeCollection.findOne({
      student_id,
      course_id,
      payment_date: {
        $gte: moment(formattedPaymentDate).startOf('month'),
        $lte: moment(formattedPaymentDate).endOf('month')
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A payment for this student in the same month has already been made."
      });
    }

    // Calculate the monthly payment amount (assuming it's stored in the course model)
    const monthlyPaymentAmount = student.course_id.totalFee / student.course_id.course_duration;

    // Create the fee collection for the current payment
    const newFeeCollection = new FeeCollection({
      student_id,
      course_id,
      amount_paid: monthlyPaymentAmount,
      payment_date: formattedPaymentDate.toDate(), // Store the validated date
      payment_method
    });

    // Save the current payment
    await newFeeCollection.save();

    // Update the student's total fee paid
    student.fee += (student.totalFeePaid || 0) + amount_paid;
    await student.save();

    // If the payment exceeds the monthly amount, create additional records for future months
    let remainingAmount = amount_paid - monthlyPaymentAmount;
    let nextPaymentDate = moment(formattedPaymentDate);

    while (remainingAmount >= monthlyPaymentAmount) {
      nextPaymentDate = nextPaymentDate.add(1, 'month');

      const nextFeeCollection = new FeeCollection({
        student_id,
        course_id,
        amount_paid: monthlyPaymentAmount,
        payment_date: nextPaymentDate.toDate(),
        payment_method
      });

      await nextFeeCollection.save();
      remainingAmount -= monthlyPaymentAmount; // Subtract the monthly payment from the remaining amount
    }

    return res.status(201).json({
      success: true,
      message: "Fee collection record created successfully",
      data: newFeeCollection
    });
  } catch (error) {
    console.error("Error creating fee collection:", error);
    return res.status(500).json({ success: false, message: "Failed to create fee collection" });
  }
};





exports.getFeeDetailsByStudent = async (req, res) => {
  const studentId = req.params.id;

  // console.log(studentId, "student id")
  try {
    // Find the student and populate the course details
    const student = await Student.findById(studentId).populate("course_id").populate("institute_id");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Extract relevant details from the student
    const enrollmentDate = moment(student.enrollment_date);
    const courseDuration = student.course_id.course_duration; // Course duration in months
    const courseEndDate = moment(enrollmentDate).add(courseDuration, 'months'); // Calculate the course end date
    const currentDate = moment(); // Current date

    // Initialize an empty array to store fee details for each month
    const feeDetails = [];

    
    const monthsEnrolled = Math.floor((new Date() - enrollmentDate) / (1000 * 60 * 60 * 24 * 30));
    // console.log(monthsEnrolled, "monthsEnrolled")
    const dueFee = Math.min(monthsEnrolled, student.course_id.course_duration) * ((student.course_id.totalFee)/(student.course_id.course_duration));
    // console.log(dueFee, " is total due Fee  and total paid is ", student.fee)
    // Iterate over each month from the enrollment date to the current date or course end date (whichever is earlier)
    let month = enrollmentDate.clone();
    while (month.isBefore(moment.min(currentDate, courseEndDate), 'month')) {
      const startOfMonth = month.clone().startOf('month').toDate();
      const endOfMonth = month.clone().endOf('month').toDate();

      // Check if payment has been made for the current month
      const feeRecord = await FeeCollection.findOne({
        student_id: studentId,
        payment_date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      // Calculate the monthly fee amount
      const monthlyFeeAmount = student.course_id.totalFee / courseDuration;

      // If feeRecord exists, the fee was paid, otherwise, it's unpaid
      feeDetails.push({
        month: month.format("YYYY-MM"),
        feePaid: feeRecord ? true : false,
        amountPaid: feeRecord ? feeRecord.amount_paid : 0,
        monthlyFeeAmount,
        pendingFee: feeRecord ? 0 : monthlyFeeAmount,
      });

      // Move to the next month
      month.add(1, 'month');
    }

    // Return the result
    res.json({
      success: true,
      student,
      totalPending: dueFee-student.fee,
      feeDetails
    });
  } catch (error) {
    console.error("Error retrieving fee details for student:", error);
    res.status(500).json({ message: "Server error" });
  }
};
