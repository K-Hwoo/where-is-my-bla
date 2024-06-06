const path = require("path");
const userRoutes = require("./routes/user.js");
const wimpRoutes = require("./routes/wimp.js");
const db = require("./data/database");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;

const express = require("express");
const mongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new mongoDBStore({
  uri: "mongodb://localhost:27017",
  databaseName: "WIMP",
  collection: "sessions",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("videos"));
app.use(express.static("images"));
app.use("/images", express.static("images"));

app.use(
  session({
    secret: "super-secret",
    resave: false,
    saveUninitialized: false,
    // 내부에 데이터가 없는 빈 세션은 데이터베이스에 저장되지 않으므로 세션 쿠키 생성 X
    store: sessionStore, // 세션 데이터가 실제로 저장되어야 하는 위치 제어
  })
);

app.use(async function (req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if (!user || !isAuth) {
    return next();
  }

  const userDoc = await db
    .getDb()
    .collection("users")
    .findOne({ _id: new ObjectId(user.id) });
  const nickname = userDoc.nickname;

  res.locals.isAuth = isAuth; // global variable, 모든 템플릿에서 사용 가능
  res.locals.nickname = nickname;
  res.locals.userId = user.id;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(userRoutes);
app.use(wimpRoutes);

app.use(function (error, req, res, next) {
  console.log(error);
  res.status(500).render("500");
});

db.connetToDatabase().then(function () {
  app.listen(3000);
});
