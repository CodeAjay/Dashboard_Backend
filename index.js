const express = require("express")
require("./db");
const bodyParser = require("body-parser");
const cors = require('cors')

const {authenticate, authorizeRoles } = require("./middleware/authentication")

const app = express();
const port = 3000;


app.use(cors());

app.use(bodyParser.json());

const loginRoute=require("./routes/authentication/authenticatino")
const announceRoutes=require("./routes/adminRoutes/announceRoutes")
const courseRoutes=require("./routes/adminRoutes/coursesRoutes")
const studentRoutes=require("./routes/adminRoutes/studentsRoutes")
const instituteRoutes=require("./routes/adminRoutes/instituteRoutes")
const feeCollectionRoutes=require("./routes/adminRoutes/feeCollection")
const students=require("./routes/studentsRoutes/student")

app.use("/login", loginRoute); // Public route to log in

// Admin-only routes
app.use("/announcements", announceRoutes);
app.use("/courses", courseRoutes);
app.use("/students", studentRoutes); // Admin and clerk
app.use("/institutes", instituteRoutes);
app.use("/fee-collection", feeCollectionRoutes); // Admin and clerk


// Students Routes
app.use("/api", students)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});