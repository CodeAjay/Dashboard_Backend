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
app.use("/announcements", authenticate, authorizeRoles("admin"), announceRoutes);
app.use("/courses", authenticate, authorizeRoles("admin"), courseRoutes);
app.use("/students", authenticate, authorizeRoles("admin", "clerk"), studentRoutes); // Admin and clerk
app.use("/institutes", authenticate, authorizeRoles("admin"), instituteRoutes);
app.use("/fee-collection", authenticate, authorizeRoles("admin", "clerk"), feeCollectionRoutes); // Admin and clerk


// Students Routes
app.use("/api", authenticate, authorizeRoles("admin", "clerk"), students)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});