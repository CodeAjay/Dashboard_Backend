const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course");

<<<<<<< HEAD
router.post("/", courseController.postCourses);
router.get("/", courseController.getCourses);
router.put("/:id", courseController.editCourse);
router.delete("/:id", courseController.deleteCourse);
=======
const courses=require("../controllers/course");
const course = require("../models/course");

router.post("/", courses.postCourse); // Only authenticated users can place orders
router.get("/", courses.getCourses); // Admin can view all orders
// router.put("/:id", course.e); 
router.delete('/:id', courses.deleteCourse);

>>>>>>> b82a7f36c33a593168df55dca65555cc27aab09a

module.exports = router;
