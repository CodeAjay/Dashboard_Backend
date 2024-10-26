const Enquiry = require("../../models/enquiry");
const Student = require("../../models/student")

exports.getEnquiries = async (req, res) => {
  try {
    const { user } = req; // Assuming user is attached to req by middleware
    let query = {};
    if (user.role === "clerk") {
      query.institute_id = user.institute_id; // Filter by institute_id
    }

    // Retrieve enquiries based on user role and populate related fields
    const enquiries = await Enquiry.find(query)
      .populate("institute_id")
      .populate("course_id")
      .sort({ _id: -1 });

    res.status(200).json(enquiries);
  } catch (error) {
    console.error("Error retrieving enquiries:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.postEnquiries = async (req, res) => {
  try {
    const { user } = req;
    if (user.role === "clerk") {
      req.body.institute_id = user.institute_id;
    }

    const { name, email, course_id, institute_id, enquiry, mobile, address, enquiry_date, DOB } = req.body;

    const existingEnquiry = await Enquiry.findOne({ email });
    if (existingEnquiry) {
      return res.status(400).json({ message: "An enquiry with this email already exists." });
    }

    const enquiryData = new Enquiry({
      name,
      email,
      course_id,
      institute_id,
      enquiry,
      mobile,
      address,
      enquiry_date: new Date(),
      DOB,
    });

    await enquiryData.save();

    const populatedEnquiry = await Enquiry.findById(enquiryData._id)
      .populate("institute_id")
      .populate("course_id");

    res.status(201).json(populatedEnquiry);
  } catch (error) {
    console.error("Error adding enquiry:", error);
    res.status(500).json({ message: "Error adding enquiry", error });
  }
};

exports.editEnquiries = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id);
    if (user.role === "clerk" && enquiry.institute_id.toString() !== user.institute_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this enquiry" });
    }

    const { name, email, institute_id, course_id, enquiry: enquiryText, mobile, address, enrollment_date, DOB } = req.body;

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        name,
        email,
        institute_id,
        course_id,
        enquiry: enquiryText,
        mobile,
        address,
        enrollment_date,
        DOB,
      },
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    const populatedEnquiry = await Enquiry.findById(updatedEnquiry._id)
      .populate("institute_id")
      .populate("course_id");

    res.status(200).json(populatedEnquiry);
  } catch (error) {
    console.error("Error updating enquiry:", error);
    res.status(500).json({ message: "Error updating enquiry", error });
  }
};

exports.deleteEnquiries = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id);
    if (user.role === "clerk" && enquiry.institute_id.toString() !== user.institute_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this enquiry" });
    }

    const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Enquiry deleted successfully", deletedEnquiry });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({ message: "Error deleting enquiry", error });
  }
};


// Convert Enquiry to Admission
exports.convertToAdmission = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the enquiry to convert
      const enquiry = await Enquiry.findById(id);
  
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found" });
      }
  
      // Create a new admission entry based on the enquiry details
      const student = new Student({
        name: enquiry.name,
        email: enquiry.email,
        course_id: enquiry.course_id,
        institute_id: enquiry.institute_id,
        mobile: enquiry.mobile,
        address: enquiry.address,
        enrollment_date: new Date(),
        // enquiry_id: enquiry._id, // Storing reference to original enquiry
      });
  
      await student.save();
  
          // Mark the enquiry as converted instead of deleting
    enquiry.converted = true;
    enquiry.converted_on = new Date();
    await enquiry.save();
  
      res.status(200).json({ message: "Enquiry converted to admission", student });
    } catch (error) {
      console.error("Error converting enquiry:", error);
      res.status(500).json({ message: "Error converting enquiry", error });
    }
  };
  
  // Delete enquiries older than 6 months (Scheduled Job)
  exports.deleteOldEnquiries = async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
      const deletedEnquiries = await Enquiry.deleteMany({
        createdAt: { $lt: sixMonthsAgo },
      });
  
      console.log(`${deletedEnquiries.deletedCount} enquiries older than 6 months were deleted.`);
    } catch (error) {
      console.error("Error deleting old enquiries:", error);
    }
  };