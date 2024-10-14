const express = require("express");
const router = express.Router();

const courses=require("../controllers/course");
const course = require("../models/course");

router.post("/", courses.postCourse); // Only authenticated users can place orders
router.get("/", courses.getCourses); // Admin can view all orders
// router.put("/:id", course.e); 
router.delete('/:id', courses.deleteCourse);


module.exports = router;
