const express = require("express");
const router = express.Router();

const AWSS3 = require("../controllers/awsS3Bucket");

router.post("/uploadImage", AWSS3.uploadImages);
router.get("/getImages", AWSS3.getImages);
router.post("/deleteImages", AWSS3.deleteBulkImages);
router.delete("/deleteImage/:key", AWSS3.deleteImage);

module.exports = router;
