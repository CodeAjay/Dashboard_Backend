const express = require("express");
const router = express.Router();
const feeCollection = require("../../controllers/admin/feeCollection");

router.post("/", feeCollection.createFeeCollection);
router.post("/fees", feeCollection.getFeeCollection);
router.get("/payment-status/:month", feeCollection.getFeeCollectionById);
// router.delete("/:id", feeCollection.deleteFeeCollection);

module.exports = router;
