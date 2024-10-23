const Institute = require("../../models/institute");

/// GET all institutes
exports.getInstitutes = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware

    // Initialize query object
    let query = {};

    // Check if the user is a clerk
    if (user.role === "clerk") {
      query._id = user.institute_id; // Filter by clerk's institute_id
    }

    // Retrieve institutes based on the query
    const institutes = await Institute.find(query);

    // console.log(institutes, "institutes");

    // Check if institutes were found
    if (institutes.length === 0) {
      return res.status(404).json({ message: "No institutes found" });
    }

    res.status(200).json(institutes);
  } catch (error) {
    console.error("Error retrieving institutes:", error);
    res.status(500).json({ message: "Server error" });
  }
};
