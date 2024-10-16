// routes/feeCollection.js
const express = require("express");
const FeeCollection = require("../models/feeCollection");
const Student = require("../models/student");

const router = express.Router();

// GET /api/fee-collection/last-12-months
router.get("/last-12-months", async (req, res) => {
  try {
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12); // Set to 12 months ago

    const result = await FeeCollection.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "institutes",
          localField: "student.institute_id",
          foreignField: "_id",
          as: "institute"
        }
      },
      { $unwind: "$institute" },
      {
        $match: {
          payment_date: {
            $gte: last12Months,
            $lte: new Date() // Up to the current date
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$payment_date" }
          },
          total_fee_collected: { $sum: "$amount_paid" }
        }
      },
      {
        $sort: { "_id": 1 } // Sort by month
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error retrieving fee collection:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/fee-collection/payment-status/:month
router.get("/payment-status/:month", async (req, res) => {
    const month = req.params.month; // Expecting format YYYY-MM, e.g., '2023-10'
  
    try {
      // Parse the month into a start and end date
      const startDate = new Date(month);
      startDate.setDate(1); // First day of the month
      const endDate = new Date(month);
      endDate.setMonth(endDate.getMonth() + 1); // First day of the next month
  
      // Get the list of all students
      const students = await Student.find().populate("institute_id course_id");
  
      // Get the fee collection records for the specified month
      const feeCollections = await FeeCollection.find({
        payment_date: {
          $gte: startDate,
          $lt: endDate
        }
      }).populate("student_id");
  
      // Create a map of paid student IDs for quick lookup
      const paidStudentIds = new Set(feeCollections.map(fee => fee.student_id._id.toString()));
  
      // Separate students into paid and not paid
      const paidStudents = [];
      const notPaidStudents = [];
  
      students.forEach(student => {
        if (paidStudentIds.has(student._id.toString())) {
          paidStudents.push(student);
        } else {
          notPaidStudents.push(student);
        }
      });
  
      // Return the results
      res.json({ paidStudents, notPaidStudents });
    } catch (error) {
      console.error("Error retrieving payment status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

module.exports = router;
