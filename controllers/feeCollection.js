
const FeeCollection = require("../models/feeCollection")
const Student = require("../models/student");
const moment = require('moment'); // For date format changing

// Get Fee collection of last 12 months or from date x-y
exports.getFeeCollection = async (req, res) => {
  try {
    const { from, to } = req.body;

    // Check if the dates are provided, else default to last 12 months
    const toDate = to ? moment(to, ['DD-MM-YYYY', 'YYYY-MM-DD']).toDate() : new Date();
    const fromDate = from
      ? moment(from, ['DD-MM-YYYY', 'YYYY-MM-DD']).toDate()
      : moment(toDate).subtract(12, 'months').toDate(); // Last 12 months if 'from' not provided

    console.log("Querying for fee collections from:", fromDate, "to:", toDate);

    const result = await FeeCollection.find({
      payment_date: {
        $gte: fromDate,
        $lte: toDate,
      },
    });

    // Return the result
    res.json(result);
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

    // Get the fee collection records for the specified month
    const feeCollections = await FeeCollection.find({
      payment_date: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate("student_id");
    // console.log(feeCollections,"feeCollections")
    // Create a set of paid student IDs
    const paidStudentIds = new Set(feeCollections.map(fee => fee.student_id._id.toString()));
    // console.log(paidStudentIds, "paidStudentIds")
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
  