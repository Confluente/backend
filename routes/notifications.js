var express = require("express");
var Q = require("q");
var marked = require("marked");
var Sequelize = require("sequelize");
var permissions = require("../permissions");
var Activity = require("../models/activity");
var Group = require("../models/group");
var User = require("../models/user");

var router = express.Router();

router.route("/portraitRight/:id")
    .put(function (req, res) {
        var userId = res.locals.session ? res.locals.session.user : null;
        if (parseInt(req.params.id) !== userId) return res.sendStatus(403);
        User.findByPk(userId).then(function (user) {
            user.update({consentWithPortraitRight: req.body.answer}).then(function (result) {
                res.send(user);
            })
        })
    });

module.exports = router;