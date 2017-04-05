var express = require("express");

var User = require("../models/user");
var permissions = require("../permissions");

var router = express.Router();

router.route("/")
.all(permissions.requireAll({type: "USER_MANAGE"}))
.get(function (req, res, next) {
  User.findAll().then(function (results) {
    res.send(results);
  });
});

module.exports = router;
