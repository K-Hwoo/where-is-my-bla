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
  const enteredEmail = userData["user-email"];
  const enteredPassword = userData.res.redirect("/login");
});

router.get("/login", function (req, res) {
  res.render("login");
});

module.exports = router;
