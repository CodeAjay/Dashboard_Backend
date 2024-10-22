const express = require("express");
const router = express.Router();

const clerkAnnounce=require("../../controllers/clerk/announcement")

router.post("/", clerkAnnounce.postAnnouncements); 
router.get("/", clerkAnnounce.getAnnouncements); 
router.put("/:id", clerkAnnounce.editAnnouncement); 
router.delete('/:id', clerkAnnounce.deleteAnnouncement);


module.exports = router;
