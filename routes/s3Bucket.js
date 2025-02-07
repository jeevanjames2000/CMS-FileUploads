const express = require("express");
const router = express.Router();

const AWSS3 = require("../controllers/awsS3Bucket");

router.post("/uploadImage", AWSS3.uploadImages);

module.exports = router;
