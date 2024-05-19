const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const db = require("../data/database");
let test = require("./wimp.js");

const router = express.Router();

router.get("/", function (req, res) {
  req.session.loginFlag = {
    redirectTeamBuildPage: false,
    redirectMain: false,
  }; // redirect UX 개선을 위한 session 정보

  res.render("wimp");
});

// 회원가입
router.get("/register", function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      nickname: "",
      password: "",
      confirmPassword: "",
    };
  }

  req.session.inputData = null;

  res.render("register", { inputData: sessionInputData });
});

router.post("/register", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData["user-email"]; // .표기법에서 dash는 사용불가
  let enteredNickname = userData.nickname;
  const enteredPassword = userData["user-password"];
  const enteredConfirmPassword = userData["user-password-confirm"];

  if (
    !enteredEmail || // input에 required 처리함
    !enteredPassword || // input에 required 처리함
    !enteredConfirmPassword || // input에 required 처리함
    enteredPassword.trim() < 6 ||
    enteredConfirmPassword.trim() < 6 ||
    enteredPassword !== enteredConfirmPassword ||
    !enteredEmail.includes("@")
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid input - please check your data.",
      email: enteredEmail,
      nickname: enteredNickname,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
    };

    req.session.save(function () {
      console.log("Incorrect data");
      return res.redirect("/register");
    });

    return; // 서버 충돌 방지
  } // 회원 가입시 에러 처리

  // 이메일 중복 체크 - 유저 중복 체크가 닉네임 보다 우선
  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "User exists already!",
      email: enteredEmail,
      nickname: enteredNickname,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
    };

    req.session.save(function () {
      console.log("중복 이메일");
      return res.redirect("/register");
    });
    return;
  }

  // 닉네임 중복 체크
  const existingNickname = await db
    .getDb()
    .collection("users")
    .findOne({ nickname: enteredNickname });

  if (existingNickname) {
    req.session.inputData = {
      hasError: true,
      message: "Nickname exists already!",
      email: enteredEmail,
      nickname: enteredNickname,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
    };

    req.session.save(function () {
      console.log("중복 닉네임");
      return res.redirect("/register");
    });
    return;
  }

  if (!enteredNickname) {
    const userid = uuidv4();
    enteredNickname = `user${userid.substr(25, 10)}`;
  }
  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    nickname: enteredNickname,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  console.log("registered!");
  res.redirect("/login");
});

// 로그인
router.get("/login", function (req, res) {
  req.session.loginFlag.redirectMain = true;
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      password: "",
    };
  }

  req.session.inputData = null;

  res.render("login", { inputData: sessionInputData });
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData["user-email"];
  const enteredPassword = userData["user-password"];

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - please check yout credentials!",
      email: enteredEmail,
      password: enteredPassword,
    };
    req.session.save(function () {
      console.log("Could not log in!");
      return res.redirect("/login");
    });

    return;
  }

  const passwordAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!passwordAreEqual) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - please check yout credentials!",
      email: enteredEmail,
      password: enteredPassword,
    };
    req.session.save(function () {
      console.log("Could not log in! - password are not correct!");
      return res.redirect("/login");
    });

    return;
  }

  req.session.user = {
    id: existingUser._id,
    email: existingUser.email,
  };
  req.session.isAuthenticated = true;
  req.session.save(function () {
    // 인증이 필요한 페이지로의 redirect를 위해
    console.log("User is authenticated!");
    if (
      req.session.loginFlag.redirectTeamBuildPage &&
      req.session.loginFlag.redirectMain
    ) {
      // Build Team 페이지를 통해 로그인한 경우 Build Team 페이지로 redirect 되게
      res.redirect("/buildteam");
      req.session.loginFlag = null;
    } else {
      // SignIn을 통해 로그인한 경우 메인 페이지로 redirect 되게
      res.redirect("/");
    }
  });
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/");
});

router.get("/userprofile", function (req, res) {
  if (!req.session.isAuthenticated) {
    return res.redirect("/login");
  }

  res.render("profile");
});

module.exports = router;
