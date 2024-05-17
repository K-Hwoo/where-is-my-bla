const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("wimp");
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", async function (req, res) {
  const inputData = req.body;
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.get("/userprofile", function (req, res) {
  res.render("profile");
});

module.exports = router;
