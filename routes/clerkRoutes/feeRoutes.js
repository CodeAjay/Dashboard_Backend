const express = require("express");
const router = express.Router();
const clerkFeeCollection = require("../../controllers/clerk/feeCollection");

router.post("/", clerkFeeCollection.createFeeCollection);
router.post("/fees", clerkFeeCollection.getFeeCollection);
router.get("/payment-status/:month", clerkFeeCollection.getFeeCollectionById);
// router.put("/:id", courseController.editCourse);
// router.delete("/:id", feeCollection.deleteFeeCollection);

module.exports = router;
