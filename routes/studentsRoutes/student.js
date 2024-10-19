const express = require("express");
const router = express.Router();

const student=require("../../controllers/student/student")

router.get("/student/:studentId/course-details", student.getStudentCourseDetails); 
router.get("/student/announcements", student.getStudentAnnouncements); 
router.get("/student/:studentId/past-payments", student.getStudentPastPayments); 


module.exports = router;
