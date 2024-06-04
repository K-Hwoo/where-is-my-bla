const express = require("express");
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;

const db = require("../data/database");

const router = express.Router();

// 메인 페이지 라우팅은 user.js에서

router.get("/jointeam", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find({}, { title: 1, summary: 1, "who.nickname": 1 })
    .toArray();

  res.render("team-list", { posts: posts });
});

router.get("/buildteam", function (req, res) {
  if (!req.session.isAuthenticated) {
    req.session.loginFlag.redirectTeamBuildPage = true;
    return res.redirect("/login");
  }

  res.render("team-build");
});

router.post("/buildteam", async function (req, res) {
  // authors에 대한 컬렉션 데이터를 수동으로 가져와서 join
  const userID = new ObjectId(req.session.user.id);
  const user = await db.getDb().collection("users").findOne({ _id: userID });

  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    who: {
      id: userID,
      nickname: user.nickname,
    }, // posts 컬렉션의 데이터와 Join 해줌,
    // 변하지 않을 것이라 예상되는 데이터는 join 해주면 관리하기 편함
    // email은 자주 바뀔 가능성이 있기에 join 해주지 않을 것임
  };

  await db.getDb().collection("posts").insertOne(newPost);

  res.redirect("/jointeam");
});

// 팀 세부정보 보기 라우팅
router.get("/posts/:id", async function (req, res) {
  const postId = req.params.id;
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) }, { summary: 0 });

  if (!post) {
    return res.status(404).render("404");
  }

  post.humanReadableDate = post.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  post.date = post.date.toISOString();

  res.render("team-detail", { post: post, comments: null });
});

module.exports = router;
