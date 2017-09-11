var path = require("path");
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var Q = require("q");

var log = require("./logger");
var checkPermission = require("./permissions").check;

var webroot;

var app = express();

if (process.env.NODE_ENV === "test") {
  console.log("NODE_ENV=test");
  webroot = path.resolve(__dirname, "www");
} else if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
  webroot = path.resolve(__dirname, "../frontend/src");
} else {
  webroot = path.resolve(__dirname, "../frontend/build");
  app.use(morgan("combined", {stream: require("fs").createWriteStream("./access.log", {flags: "a"})}));

  app.use(function (req, res, next) {
    log.info({req: req}, "express_request");
    next();
  });
}

app.use(bodyParser.json());
app.use(cookieParser());

var Session = require("./models/session");

app.use(function (req, res, next) {
  //console.log(req.cookies.session);
  if (req.cookies.session) {
    var token = Buffer.from(req.cookies.session, "base64");
    Session.findOne({where: {token: token}}).then(function (session) {
      if (session) {
        res.locals.session = session.dataValues;
      } else {
        res.clearCookie("session");
      }
      next();
    });
  } else {
    next();
  }
});

app.use(function (req, res, next) {
  var user = res.locals.session ? res.locals.session.user : null;
  checkPermission(user, {type: "PAGE_VIEW", value: req.path})
  .then(function (hasPermission) {
    if (!hasPermission) {
      if (user) {
        return res.status(403).send();
      } else {
        return res.status(401).send();
      }
    }
    return next();
  }).done();
});

//app.use("/admin", require("./admin"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/group", require("./routes/group"));
app.use("/api/user", require("./routes/user"));
app.use("/api/page", require("./routes/page"));
app.use("/api/*", function (req, res) {
  res.sendStatus(404);
});

app.use(express.static(webroot));

app.get("*", function (req, res, next) {
  if (req.originalUrl.includes(".")) {
    return res.sendStatus(404);
  }
  res.sendFile("/index.html", {root: webroot});
  //next();
});

app.use(function (err, req, res, next) {
  console.error(err);
  //throw err;
});

module.exports = app;
