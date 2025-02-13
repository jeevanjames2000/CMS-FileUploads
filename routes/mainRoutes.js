const express = require("express");
const router = express.Router();

const cmsController = require("../controllers/cmsController");

router.post("/uploadImage", cmsController.uploadImages);
router.post("/uploadMongoImage", cmsController.uploadMongoImages);
router.post("/deleteImages", cmsController.deleteLocalImage);
router.get("/getImage/:name", cmsController.getImage);
router.get("/getAllImages", cmsController.getAllImages);
router.get("/getMongoImages", cmsController.getMongoImage);
router.post("/uploadCMS", cmsController.uploadCMS);
router.get("/getCMS", cmsController.getCMS);
router.delete("/deleteYoutube", cmsController.deleteYoutube);

module.exports = router;
