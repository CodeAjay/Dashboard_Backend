const express = require("express");
const router = express.Router();
const enquiryController = require("../../controllers/admin/enquiry");

router.get("/", enquiryController.getAllEnquiriesForAdmin);
router.get("/converted", enquiryController.getConvertedEnquiriesForAdmin);

module.exports = router;
