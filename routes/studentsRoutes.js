const express = require("express");
const router = express.Router();

const student=require("../controllers/students")

router.post("/", student.postStudents); 
router.get("/", student.getStudents); 
router.put("/:id", student.editStudents); 
router.delete('/:id', student.deleteStudents);


module.exports = router;
