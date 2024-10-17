const express = require("express");
const router = express.Router();
const courseController = require("../../controllers/course");

router.post("/", courseController.postCourses);
router.get("/", courseController.getCourses);
router.put("/:id", courseController.editCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
