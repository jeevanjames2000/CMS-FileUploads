const express = require("express");
const router = express.Router();

const cmsController = require("../controllers/cmsController");

router.post("/uploadImage", cmsController.uploadImages);
router.post("/deleteImages", cmsController.deleteLocalImage);
router.get("/getImage/:name", cmsController.getImage);
router.get("/getAllImages", cmsController.getAllImages);
module.exports = router;
