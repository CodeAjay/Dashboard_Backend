const express = require("express");
const router = express.Router();
const feeCollection = require("../../controllers/admin/feeCollection");

router.post("/", feeCollection.createFeeCollection);
router.post("/fees", feeCollection.getFeeCollection);
router.get("/payment-status/:month", feeCollection.getFeeCollectionById);
router.get("/pending/fee", feeCollection.getPendingFeeCollections);
router.get("/:id", feeCollection.getFeeDetailsByStudent);
router.post("/approve", feeCollection.approveFeeCollections);
// router.delete("/:id", feeCollection.deleteFeeCollection);

module.exports = router;
