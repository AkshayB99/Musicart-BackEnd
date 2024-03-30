const express = require("express");
const dataController = require("./../controllers/dataController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.route("/").get(dataController.getAllData);

router.get("/dataByIds", authController.protect, dataController.getDataByIds);

module.exports = router;
