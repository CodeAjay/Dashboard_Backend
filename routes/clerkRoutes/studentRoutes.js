const express = require("express");
const router = express.Router();

const clerk=require("../../controllers/clerk/students")

router.post("/", clerk.postStudents); 
router.get("/", clerk.getStudents); 
router.put("/:id", clerk.editStudents); 
router.delete('/:id', clerk.deleteStudents);


module.exports = router;
