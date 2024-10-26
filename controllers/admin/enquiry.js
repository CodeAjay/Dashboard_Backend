const Enquiry = require("../../models/enquiry");

// Get All Enquiries (For Admin)
exports.getAllEnquiriesForAdmin = async (req, res) => {
  try {
    const { user } = req;

    // Only allow admins to access this route
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const enquiries = await Enquiry.find()
      .populate("institute_id")
      .populate("course_id")
      .sort({ _id: -1 }); // Sort by newest first

    res.status(200).json(enquiries);
  } catch (error) {
    console.error("Error retrieving all enquiries:", error);
    res.status(500).json({ message: "Error retrieving enquiries", error });
  }
};

// Get Converted Enquiries Only (For Admin)
exports.getConvertedEnquiriesForAdmin = async (req, res) => {
  try {
    const { user } = req;

    // Only allow admins to access this route
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const convertedEnquiries = await Enquiry.find({ converted: true })
      .populate("institute_id")
      .populate("course_id")
      .sort({ converted_on: -1 }); // Sort by most recently converted first

    res.status(200).json(convertedEnquiries);
  } catch (error) {
    console.error("Error retrieving converted enquiries:", error);
    res.status(500).json({ message: "Error retrieving converted enquiries", error });
  }
};
