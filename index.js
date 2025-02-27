require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
require("./database");
const cmsRoutes = require("./routes/mainRoutes");
const awsRoutes = require("./routes/s3Bucket");
const driveRoutes = require("./routes/googleDrive");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use("/cms", cmsRoutes);
app.use("/aws", awsRoutes);
app.use("/drive", driveRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
