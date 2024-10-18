
const FeeCollection = require("../models/feeCollection")
const Student = require("../models/student");
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

    // Get all students
    const students = await Student.find().populate("institute_id course_id");

    // console.log(students[0]._id, "students")

    // Get the fee collection records for the specified month
    const feeCollections = await FeeCollection.find({
      payment_date: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate("student_id");

    // console.log(feeCollections,"feeCollections")

    // Create a set of paid student IDs, but only for those with valid `student_id`
    const paidStudentIds = new Set(
      feeCollections
        .filter(fee => fee.student_id) // Only include records with non-null `student_id`
        .map(fee => fee.student_id._id.toString())
    );

    console.log(paidStudentIds,"paidStudentIds")

    // Separate students into paid and not paid
    const paidStudents = [];
    const notPaidStudents = [];

    students.forEach(student => {
      if (paidStudentIds.has(student._id.toString())) {
        paidStudents.push(student); // Student has paid
      } else {
        notPaidStudents.push(student); // Student has not paid
      }
    });

    // Return the results
    res.json({ paidStudents, notPaidStudents });
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({ message: "Server error" });
  }
};




  exports.createFeeCollection = async (req, res) => {
    try {
      const { student_id, course_id, amount_paid, payment_date, payment_method } = req.body;
      
      // Log the received data to ensure it's coming through properly
      console.log("Received data:", req.body);
  
      if (!student_id || !course_id || !amount_paid || !payment_date || !payment_method) {
        return res.status(400).json({
          success: false,
          message: "All fields are required: student_id, course_id, amount_paid, payment_date, payment_method"
        });
      }
  
      const newFeeCollection = new FeeCollection({
        student_id,
        course_id,
        amount_paid,
        payment_date,
        payment_method
      });
  
      await newFeeCollection.save();
  
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
  