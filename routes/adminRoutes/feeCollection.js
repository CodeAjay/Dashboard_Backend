const express = require("express");
const router = express.Router();
const feeCollection = require("../../controllers/feeCollection");

router.post("/", feeCollection.createFeeCollection);
router.get("/", feeCollection.getFeeCollection);
router.get("/payment-status/:month", feeCollection.getFeeCollectionById);
// router.put("/:id", courseController.editCourse);
// router.delete("/:id", feeCollection.deleteFeeCollection);

module.exports = router;
