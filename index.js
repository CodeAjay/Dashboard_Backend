const express = require("express")
require("./db");
const bodyParser = require("body-parser");
const cors = require('cors')

const app = express();
const port = 3000;


app.use(cors());

app.use(bodyParser.json());


const announceRoutes=require("./routes/adminRoutes/announceRoutes")
const courseRoutes=require("./routes/adminRoutes/coursesRoutes")
const studentRoutes=require("./routes/adminRoutes/studentsRoutes")
const instituteRoutes=require("./routes/adminRoutes/instituteRoutes")
const feeCollectionRoutes=require("./routes/adminRoutes/feeCollection")

app.use("/announcements", announceRoutes)
app.use("/courses", courseRoutes)
app.use("/students", studentRoutes)
app.use("/institutes", instituteRoutes)
app.use("/fee-collection", feeCollectionRoutes)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});