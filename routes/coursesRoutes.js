const express = require("express");
const router = express.Router();

const courses=require("../controllers/course")

router.post("/", courses.postCourse); // Only authenticated users can place orders
router.get("/", courses.getCourses); // Admin can view all orders


module.exports = router;
