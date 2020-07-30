var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
var authHelper = require("../helpers/authHelper");

var router = express.Router();

router.route("/")
    .get(function (req, res, next) {
        if (!res.locals.session) {
            return res.sendStatus(401);
        }
        User.findByPk(res.locals.session.user, {
            attributes: ["id", "email", "displayName", "isAdmin", "consentWithPortraitRight"],
            include: [{
                model: Group,
                attributes: ["id", "displayName", "fullname", "description", "canOrganize", "email"]
            }]
        }).then(function (user) {
            var profile = user.dataValues;
            //console.log(profile.groups);
            /*
            return user.getGroups();
          }).then(function (groups) {
            //console.log(groups[0].user_group);
            */
            profile.canOrganize = profile.isAdmin || profile.groups.some(function (e) {
                return e.canOrganize;
            });

            res.send(profile);
        });
    });

router.route("/login")
    .post(function (req, res, next) {
        if (!req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }
        var credentials = {
            email: req.body.email,
            password: req.body.password
        };
        authHelper.authenticate(req.body.email, req.body.password).then(function (user) {
            if (user.error === 406) {
                return res.status(406).send(user)
            }

            if (user.approved === false) {
                return res.status(406).send({error: 406, data: "User account has not yet been approved"});
            }
            res.locals.user = user;
            return authHelper.startSession(user.id, req.ip)
                .then(function (session) {
                    res.cookie('session', session.token.toString("base64"));
                    res.send(session);
                });
        }).catch(function (err) {
            //throw err;
            return res.status(500).send({error: err});
        });
    });

module.exports = router;
