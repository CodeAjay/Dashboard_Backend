const express = require("express")
require("./db");
const bodyParser = require("body-parser");
const cors = require('cors')

const {authenticate, authorizeRoles } = require("./middleware/authentication")

const app = express();
const port = 3000;


app.use(cors());

app.use(bodyParser.json());

const loginRoute=require("./routes/authentication/authentication")

app.use("/login", loginRoute); // Public route to log in


// Admin-only routes

const announceRoutes=require("./routes/adminRoutes/announceRoutes")
const courseRoutes=require("./routes/adminRoutes/coursesRoutes")
const studentRoutes=require("./routes/adminRoutes/studentsRoutes")
const instituteRoutes=require("./routes/adminRoutes/instituteRoutes")
const feeCollectionRoutes=require("./routes/adminRoutes/feeCollection")
const enquiryRoutes=require("./routes/adminRoutes/enquiryRoutes")

// Admin-only routes
app.use("/announcements", authenticate, authorizeRoles('admin'), announceRoutes);
app.use("/courses", authenticate, authorizeRoles('admin'), courseRoutes);
app.use("/students", authenticate, authorizeRoles('admin'), studentRoutes);
app.use("/institutes", authenticate, authorizeRoles('admin'), instituteRoutes);
app.use("/fee-collection", authenticate, authorizeRoles('admin'), feeCollectionRoutes);
app.use("/enquiry", authenticate, authorizeRoles('admin'), enquiryRoutes); 



// Clerk Routes

const clerkannounceRoutes=require("./routes/clerkRoutes/announcementRoutes")
const clerkCourseRoutes=require("./routes/clerkRoutes/coursesRoutes")
const clerkStudentRoutes=require("./routes/clerkRoutes/studentRoutes")
const clerkinstituteRoutes=require("./routes/clerkRoutes/institutesRoutes")
const clerkFeeCollectionRoutes=require("./routes/clerkRoutes/feeRoutes")
const clerkEnquiryRoutes=require("./routes/clerkRoutes/enquiryRoutes")

// Clerk routes
app.use("/clerk/announcements", authenticate, authorizeRoles("clerk"), clerkannounceRoutes);
app.use("/clerk/courses", authenticate, authorizeRoles("clerk"), clerkCourseRoutes);
app.use("/clerk/students", authenticate, authorizeRoles("clerk"), clerkStudentRoutes); // Admin and clerk
app.use("/clerk/institutes", authenticate, authorizeRoles("clerk"), clerkinstituteRoutes);
app.use("/clerk/fee-collection", authenticate, authorizeRoles("clerk"), clerkFeeCollectionRoutes); // Admin and clerk
app.use("/clerk/enquiry", authenticate, authorizeRoles("clerk"), clerkEnquiryRoutes); // Admin and clerk


const students=require("./routes/studentsRoutes/student")

// Students Routes
app.use("/api", authenticate, authorizeRoles("student"), students)

app.get("/",(req,res)=>{
res.status(200).json({hello:"Hello Server"})
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});