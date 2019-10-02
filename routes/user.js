var express = require("express");

var User = require("../models/user");
var permissions = require("../permissions");
var authHelper = require("../authHelper");

var router = express.Router();
var log = require("../logger");

router.route("/")
    .all(permissions.requireAll({type: "USER_MANAGE"}))
    .get(function (req, res, next) {
        User.findAll({
          attributes: ["id", "displayName", "email", "isAdmin"],
          order: [
            ["id", "ASC"]
          ]
        }).then(function (results) {
            res.send(results);
        });
    })
    .post(function (req, res, next) {
        log.info({req: req.body}, "INITIAL REQUEST");
        if (!res.locals.session) {
            return res.sendStatus(401);
        }
        if (!req.body.displayName || !req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }

        permissions.check(res.locals.session.user, {
            type: "GROUP_ORGANIZE",
            value: req.body.organizer
        }).then(function (result) {
            if (!result) return res.sendStatus(403);
            req.body.passwordSalt = authHelper.generateSalt(16); // Create salt of 16 characters
            req.body.passwordHash = authHelper.getPasswordHashSync(req.body.password, req.body.passwordSalt); // Get password hash
            delete req.body.password; // Delete password permanently
            log.info({req: req.body}, "EVENTUAL REQUEST");
            return User.create(req.body).then(function (result) {
                res.status(201).send(result);
            });
        }).done();
    });

module.exports = router;
