
const FeeCollection = require("../../models/feeCollection")
const Student = require("../../models/student");
const moment = require('moment'); // For date format changing

// Get Fee collection of last 12 months or from date x-y
exports.getFeeCollection = async (req, res) => {
  try {
    const { from, to } = req.body;

    // Check if the dates are provided, else default to last 12 months
    const toDate = to 
      ? moment(to, ['DD-MM-YYYY', 'YYYY-MM-DD']).endOf('day').toDate() // Set to the last moment of the provided day
      : new Date(); // Default to now if not provided

    const fromDate = from
      ? moment(from, ['DD-MM-YYYY', 'YYYY-MM-DD']).toDate()
      : moment(toDate).subtract(12, 'months').toDate(); // Last 12 months if 'from' not provided

    console.log("Querying for fee collections from:", fromDate, "to:", toDate);

    // Aggregation pipeline to group by month and calculate the total collection for each month
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
          from: 'students', // Assuming the collection name is 'students'
          localField: 'student_id', // Field in FeeCollection
          foreignField: '_id', // Field in Students collection
          as: 'student_details', // Name of the new array field
        },
      },
      {
        $unwind: { // Flatten the array to get individual student details
          path: '$student_details',
          preserveNullAndEmptyArrays: true // Keep records even if no matching student
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$payment_date" } }, // Group by month
          monthly_fee_collected: { $sum: "$amount_paid" }, // Sum of fees collected in that month
          payments: {
            $push: { // Collect detailed payment records
              studentId: "$student_id",
              studentName: { $concat: ["$student_details.firstName", " ", "$student_details.lastName"] }, // Assuming you have firstName and lastName fields
              amountPaid: "$amount_paid",
              paymentDate: "$payment_date",
              paymentMethod: "$payment_method", // Adjust based on your FeeCollection schema
            }
          }
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month (ascending)
      },
    ]);

    // Calculate the total fee collected for the entire period
    const totalFeeCollected = result.reduce(
      (total, month) => total + month.monthly_fee_collected,
      0
    );

    // Return the result with monthly collections and total collection
    res.json({
      totalFeeCollected,
      monthlyCollections: result,
    });
  } catch (error) {
    console.error("Error retrieving fee collection:", error);
    res.status(500).json({ message: "Server error" });
  }
};





// GET /api/fee-collection/payment-status/:month
// GET /api/fee-collection/payment-status/:month
exports.getFeeCollectionById = async (req, res) => {
  const month = req.params.month; // Expecting format YYYY-MM, e.g., '2023-10'

  try {
    // Parse the month into a start and end date
    const startDate = new Date(`${month}-01`); // First day of the month
    const endDate = new Date(`${month}-01`);
    endDate.setMonth(endDate.getMonth() + 1); // First day of the next month

    // Get all students with their course details
    const students = await Student.find().populate("institute_id course_id");

    // Get the fee collection records for the specified month
    const feeCollections = await FeeCollection.find({
      payment_date: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate("student_id");

    // Create a set of paid student IDs, but only for those with valid `student_id`
    const paidStudentIds = new Set(
      feeCollections
        .filter(fee => fee.student_id) // Only include records with non-null `student_id`
        .map(fee => fee.student_id._id.toString())
    );

    // Separate students into paid and not paid, calculate pending fees
    const notPaidStudents = [];

    students.forEach(student => {
      if (!paidStudentIds.has(student._id.toString())) {
        // Calculate the pending fee
        const course = student.course_id; // Get the course the student is enrolled in
        const enrollmentDate = new Date(student.enrollment_date);
        const currentDate = new Date();

        // Calculate the elapsed months since enrollment
        const monthsEnrolled = Math.ceil(
          (currentDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        // Calculate the total fee based on course duration and the months enrolled
        const totalFeeDue = Math.min(monthsEnrolled, course.course_duration) * (course.totalFee / course.course_duration);
        const pendingFee = totalFeeDue - student.fee;

        // Push student to not paid list if they owe a fee
        if (pendingFee > 0) {
          notPaidStudents.push({
            student,
            pendingFee
          });
        }
      }
    });

    // Sort the students by the highest pending fee
    notPaidStudents.sort((a, b) => b.pendingFee - a.pendingFee);

    // Return the result, sorted by pending fee amount
    res.json(notPaidStudents);
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.createFeeCollection = async (req, res) => {
  try {
    const { student_id, course_id, amount_paid, payment_date, payment_method } = req.body;

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

    // Find the student and course
    const student = await Student.findById(student_id).populate("course_id");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Calculate course end date based on enrollment date and course duration
    const courseEndDate = moment(student.enrollment_date).add(student.course_id.course_duration, 'months');

    // Ensure payment_date is within the enrollment and course end date range
    if (formattedPaymentDate.isBefore(moment(student.enrollment_date)) || formattedPaymentDate.isAfter(courseEndDate)) {
      return res.status(400).json({
        success: false,
        message: `Payment date must be between ${moment(student.enrollment_date).toISOString()} and ${courseEndDate.toISOString()}`
      });
    } else if (course_id !== student.course_id._id.toString()) { // Ensure comparison is made with string
      return res.status(400).json({ success: false, message: "Payment can be made to student's enrolled course only" });
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
    const monthlyPaymentAmount = student.course_id.totalFee/student.course_id.course_duration; // Adjust accordingly if the field name is different

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
    student.fee = (student.totalFeePaid || 0) + amount_paid; // Assuming there's a totalFeePaid field
    await student.save();

    // If the payment exceeds the monthly amount, create additional records for future months
    let remainingAmount = amount_paid - monthlyPaymentAmount;

    while (remainingAmount >= monthlyPaymentAmount) {
      const nextPaymentDate = moment(formattedPaymentDate).add(1, 'month');

      const nextFeeCollection = new FeeCollection({
        student_id,
        course_id,
        amount_paid: monthlyPaymentAmount,
        payment_date: nextPaymentDate.toDate(),
        payment_method
      });

      await nextFeeCollection.save();
      remainingAmount -= monthlyPaymentAmount; // Subtract the monthly payment from the remaining amount
      formattedPaymentDate.add(1, 'month'); // Move to the next payment date
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
