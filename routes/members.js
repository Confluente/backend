var express = require("express");
var member = require("../models/member")

var router = express.Router();

router.route('/')
.all(function(req, res, next) {
  next();
})
.get(function(req, res, next) {
  member.getAll().then(function(rows) {
    res.send(rows);
  });
})
.post(function(req, res, next) {
  member.add(req.body).then(function(result) {
    res.send(result);
  })
});

module.exports = router;
