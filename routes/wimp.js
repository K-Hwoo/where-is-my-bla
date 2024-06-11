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
    .find({}, { title: 1, summary: 1, who: 1 })
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
    memNum: req.body.members,
    members: [userID],
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
router.get("/post/:id", async function (req, res) {
  if (!req.session.isAuthenticated) {
    req.session.loginFlag.redirectTeamBuildPage = true;
    return res.redirect("/login");
  }

  try {
    const userId = new ObjectId(req.session.user.id);
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

    const members = await db
      .getDb()
      .collection("users")
      .find({
        _id: { $in: post.members },
      })
      .toArray();

    const isMember = post.members.some((member) => member.equals(userId));

    res.render("team-detail", {
      post: post,
      members: members,
      forCheckMine: String(post.who.id),
      isMe: String(req.session.user.id),
      isMember: isMember,
    });
  } catch (error) {
    console.error("Error fetching team data:", error);
    res.render(500);
  }
});

router.post("/jointeam/:postId", async function (req, res) {
  const userId = new ObjectId(req.session.user.id);
  const postId = new ObjectId(req.params.postId);

  try {
    // 팀의 members 배열에 사용자 ID 추가
    await db
      .getDb()
      .collection("posts")
      .updateOne(
        { _id: postId },
        { $addToSet: { members: userId } } // $addToSet을 사용하여 중복 방지
      );
    res.redirect("/userprofile/" + userId);
  } catch (error) {
    console.error("Error joining team:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Post
router.post("/post/:postId/delete", async function (req, res) {
  const postId = new ObjectId(req.params.postId);

  await db.getDb().collection("posts").deleteOne({ _id: postId });
  res.redirect("/jointeam");
});

// Edit Post
router.get("/post/:postId/edit", async function (req, res) {
  if (!req.session.isAuthenticated) {
    req.session.loginFlag.redirectTeamBuildPage = true;
    return res.redirect("/login");
  }

  const postId = new ObjectId(req.params.postId);
  const post = await db.getDb().collection("posts").findOne({ _id: postId });

  res.render("edit-post", { post: post });
});

router.post("/post/:postId/edit", async function (req, res) {
  const postId = new ObjectId(req.params.postId);

  await db
    .getDb()
    .collection("posts")
    .updateOne(
      { _id: postId },
      {
        $set: {
          title: req.body.title,
          summary: req.body.summary,
          body: req.body.content,
          memNum: req.body.members,
        },
      }
    );

  res.redirect(`/post/${postId}`);
});

module.exports = router;
