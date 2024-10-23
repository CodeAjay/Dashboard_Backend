const express = require("express");
const router = express.Router();
const institutes = require("../../controllers/clerk/institute");

router.get("/", institutes.getInstitutes);
// router.post("/", institutes.createInstitute);
// router.get("/payment-status/:month", feeCollection.getFeeCollectionById);
// router.put("/:id", courseController.editCourse);
// router.delete("/:id", feeCollection.deleteFeeCollection);

module.exports = router;
