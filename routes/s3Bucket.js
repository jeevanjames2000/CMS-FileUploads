const express = require("express");
const router = express.Router();

const AWSS3 = require("../controllers/awsS3Bucket");

router.post("/uploadImage", AWSS3.uploadImages);
router.get("/getImages", AWSS3.getImages);
router.get("/getImagesS3", AWSS3.getImagesS3);
router.delete("/deleteImages", AWSS3.deleteBulkImages);
router.delete("/deleteImage", AWSS3.deleteImage);

module.exports = router;
