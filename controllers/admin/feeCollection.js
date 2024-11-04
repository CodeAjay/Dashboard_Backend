
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

  // Validate the provided month format
  const dateParts = month.split('-');
  if (dateParts.length !== 2) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment_date format. Please provide a valid date in YYYY-MM format."
    });
  }

  // Normalize the month and year
  const year = parseInt(dateParts[0], 10);
  const mon = parseInt(dateParts[1], 10); // Convert month to number

  try {
    let startDate;
    let endDate;

    // Get current date details
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are zero-based

    if (year === currentYear && mon === currentMonth) {
      // If the provided month is the current month
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // One month ago
      startDate.setDate(1); // Set to the first day of the month
      endDate = new Date(); // Current date
    } else {
      // For previous months
      startDate = new Date(year, mon - 1, 1); // First day of the provided month
      endDate = new Date(year, mon, 0); // Last day of the provided month
    }

    // Calculate the start date as one year before the end date
    const enStartDate = new Date(year - 1, mon - 1, 1); // One year before the start of the month

    // Fetch students whose enrollment date is between the calculated start and end dates
    const students = await Student.find({
      enrollment_date: { $gte: enStartDate, $lte: endDate } // Include students enrolled in the last year
    }).populate("institute_id course_id");

    // Get the fee collection records for the specified month
    const feeCollections = await FeeCollection.find({
      payment_date: {
        $gte: startDate, // Start of the provided month
        $lt: endDate // End of the provided month
      }
    }).populate("student_id");

    // Create a set of paid student IDs based on the fee collection records
    const paidStudentIds = new Set(
      feeCollections
        .filter(fee => fee.student_id) // Only include records with valid `student_id`
        .map(fee => fee.student_id._id.toString())
    );

    // List of students who haven't paid and their pending fees
    const notPaidStudents = [];

    students.forEach(student => {
      if (!paidStudentIds.has(student._id.toString())) {
        const course = student.course_id; // Get the course the student is enrolled in
        const enrollmentDate = new Date(student.enrollment_date); // Convert to Date object

        // Calculate months enrolled based on enrollment date and course duration
        const monthsEnrolled = Math.floor((endDate - enrollmentDate) / (1000 * 60 * 60 * 24 * 30)); // Approximate month calculation

        // Calculate total fee due until the current month
        const totalFeeDue = Math.min(monthsEnrolled, course.course_duration) * (course.totalFee / course.course_duration);

        // Calculate the pending fee
        const pendingFee = totalFeeDue - student.fee;

        // If there's a pending fee, add the student to the list
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
      payment_method,
      payment_status: "pending"
    });

    // Save the current payment
    await newFeeCollection.save();

    // Update the student's total fee paid
    student.fee += (student.totalFeePaid || 0) + amount_paid; // Assuming there's a totalFeePaid field
    console.log(student.fee, "Paid Fee")
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



exports.getFeeDetailsByStudent = async (req, res) => {
  console.log("get fee details by student is called")
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
    const currentDate = moment(new Date()); // Current date
    console.log("current date is ", currentDate)
    // Initialize an empty array to store fee details for each month
    const feeDetails = [];

    
    const monthsEnrolled = Math.floor((new Date() - enrollmentDate) / (1000 * 60 * 60 * 24 * 30));
    // console.log(monthsEnrolled, "monthsEnrolled")
    const dueFee = Math.min(monthsEnrolled, student.course_id.course_duration) * ((student.course_id.totalFee)/(student.course_id.course_duration));
    // console.log(dueFee, " is total due Fee  and total paid is ", student.fee)
    // Iterate over each month from the enrollment date to the current date or course end date (whichever is earlier)
    let month = enrollmentDate.clone();
    while (month.isBefore(moment.min(currentDate, courseEndDate), 'month')) {
      const startOfMonth = month;
      const endOfMonth = month.clone().add(1, 'month');
      // console.log("for student ", student.name, " with enrollemnt date ", student.enrollment_date, " 1 month is complete on ",endOfMonth)

      
      if (endOfMonth > currentDate) break;
      
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
        month: `${month.format("YYYY-MM-DD")} - ${endOfMonth.format("YYYY-MM-DD")}`,
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


// Get all pending fee collections awaiting approval
exports.getPendingFeeCollections = async (req, res) => {
  console.log("get Pending fee collection is called");
  try {
    const pendingFeeCollections = await FeeCollection.find({ payment_status: 'pending' })
      .populate('student_id') // Populate student name
      .populate('course_id') // Populate course name
    // Check if collections are found
    if (!pendingFeeCollections) {
      return res.status(404).json({ error: "No pending fee collections found" });
    }

    // Send JSON response
    res.status(200).json({ pendingFeeCollections });
  } catch (error) {
    console.error("Error fetching data:", error);

    // Always send JSON for errors as well
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.approveFeeCollections = async (req, res) => {
  try {
    const { feeCollectionIds } = req.body; // Array of FeeCollection IDs to approve

    if (!feeCollectionIds || !feeCollectionIds.length) {
      return res.status(400).json({ success: false, message: "Please provide fee collection IDs to approve." });
    }

    // Update the status of the specified fee collections to "approved"
    const result = await FeeCollection.updateMany(
      { _id: { $in: feeCollectionIds }, payment_status: "pending" },
      { $set: { payment_status: "approved" } }
    );

    // Check if any documents were actually updated
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: "No pending fee collections found for approval." });
    }

    res.json({ success: true, message: "Fee collections approved successfully." });
  } catch (error) {
    console.error("Error approving fee collections:", error);
    res.status(500).json({ success: false, message: "Failed to approve fee collections" });
  }
};