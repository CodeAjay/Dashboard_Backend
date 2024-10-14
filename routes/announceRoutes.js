const express = require("express");
const router = express.Router();

const announce=require("../controllers/announce")

router.post("/", announce.postAnnouncements); 
router.get("/", announce.getAnnouncements); 
router.put("/:id", announce.editAnnouncement); 
router.delete('/:id', announce.deleteAnnouncement);


module.exports = router;
