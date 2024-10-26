const express = require("express");
const router = express.Router();
const enquiryController = require("../../controllers/clerk/enquiry");

router.get("/", enquiryController.getEnquiries);
router.post("/", enquiryController.postEnquiries);
router.post("/convert/:id", enquiryController.convertToAdmission);
router.delete("/", enquiryController.deleteEnquiries);
router.put("/:id", enquiryController.editEnquiries);
router.delete("/old", enquiryController.deleteOldEnquiries);

module.exports = router;
