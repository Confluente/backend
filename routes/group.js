var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");

var router = express.Router();

router.route("/")
    .all(permissions.requireAll({type: "GROUP_MANAGE"}))
    .get(function (req, res, next) {
        Group.findAll({
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize", "type"],
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
            }).catch(function (err) {
                console.error(err)
            });
        }).done();
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        Group.findByPk(req.params.id, {
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize", "type"],
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["displayName"]
                }
            ]
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
        }).done();
    })
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "GROUP_MANAGE",
            value: res.locals.group.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            return res.locals.group.update(req.body[0]).then(function (group) {
                // remove all current group members
                for (var i = 0; i < group.members.length; i++) {
                    group.members[i].user_group.destroy();
                }

                // add all new group members
                req.body[1].forEach(function (new_group_member) {
                    User.findByPk(new_group_member.id).then(function (new_user) {
                        new_user.addGroups(res.locals.group, {through: {func: new_group_member.func}}).then(console.log);
                    })
                });

                res.send(group);
            }, function (err) {
                console.error(err);
            });
        });
    })
    .delete(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "GROUP_MANAGE",
            value: res.locals.group.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.group.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });

router.route("/type/:type")
    .get(function (req, res) {
        Group.findAll({
            attributes: ["id", "fullName", "displayName", "description", "email"],
            where: {type: req.params.type},
            order: [
                ["id", "ASC"]
            ]
        }).then(function (results) {
            res.send(results);
        });
    });
module.exports = router;
