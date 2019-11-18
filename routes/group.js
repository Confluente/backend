var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");

var router = express.Router();

router.route("/")
    .all(permissions.requireAll({type: "GROUP_MANAGE"}))
    .get(function (req, res, next) {
        Group.findAll({
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize"],
            order: [
                ["id", "ASC"]
            ]
        }).then(function (results) {
            res.send(results);
        });
    })
    .post(function (req, res, next) {
        if (!res.locals.session) {
            return res.sendStatus(401);
        }
        if (!req.body.displayName || !req.body.fullName || !req.body.description || !req.body.email) {
            return res.sendStatus(400);
        }

        permissions.check(res.locals.session.user, {
            type: "GROUP_CREATE",
            value: req.body.organizer
        }).then(function (result) {
            if (!result) return res.sendStatus(403);
            return Group.create(req.body).then(function (result) {
                res.status(201).send(result);
            });
        }).done();
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        Group.findByPk(req.params.id, {
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize"]
        }).then(function (group) {
            if (group === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                res.locals.group = group;
                next();
            }
        });
    })
    .get(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "GROUP_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            var group = res.locals.group;
            res.send(group);
        });
    });
module.exports = router;
