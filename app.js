const path = require("path");
const wimpRoutes = require("./routes/wimp.js");
const db = require("./data/database");

const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("videos"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(wimpRoutes);

app.use(function (error, req, res, next) {
  console.log(error);
  res.status(500).render("500");
});

db.connetToDatabase().then(function () {
  app.listen(3000);
});
