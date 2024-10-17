const Institute = require("../models/institute");

// GET all institutes
exports.getInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find();
    res.json(institutes);
  } catch (error) {
    console.error("Error retrieving institutes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new institute
exports.createInstitute = async (req, res) => {
  const { institute_name, location } = req.body;

  // Validate input
  if (!institute_name || !location) {
    return res.status(400).json({ message: "Institute name and location are required." });
  }

  try {
    const institute = new Institute({ institute_name, location });
    const response = await institute.save();
    res.status(201).json(response); // Use 201 for successful creation
    console.log("Institute created:", response);
  } catch (error) {
    console.error("Error creating institute:", error);
    res.status(500).json({ message: "Server error" });
  }
};
