const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

// 메인 페이지 라우팅은 user.js에서

router.get("/jointeam", function (req, res) {
  res.render("team-list");
});

router.get("/buildteam", function (req, res) {
  res.render("team-build");
});

router.post("/buildteam", function (req, res) {});

// 팀 세부정보 보기 라우팅
router.get("/teamdetail", function (req, res) {
  res.render("team-detail");
});

module.exports = router;
