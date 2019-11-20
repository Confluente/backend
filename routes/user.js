var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
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
    })
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "USER_MANAGE"
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.user.update(req.body).then(function (user) {
                res.send(user);
            }, function (err) {
                console.error(err);
            });
        });
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        User.findByPk(req.params.id, {
            attributes: ["id", "displayName", "email", "isAdmin"],
        }).then(function (user) {
            if (user === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                res.locals.user = user;
                next();
            }
        });
    })
    .get(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "USER_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            var groups;
            Group.findAll({
                attributes: ["id", "fullName"],
                include: [
                    {
                        model: User,
                        as: "members",
                        attributes: ["id"],
                        where: {
                            id: req.params.id
                        }
                    }
                ]
            }).then(function (group) {
                if (group === null) {
                    res.status(404).send({status: "Not Found"});
                } else {
                    groups = group;
                    var user = res.locals.user;
                    res.send([user,groups]);
                }
            });
        });
    })
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "USER_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.user.update(req.body).then(function (user) {
                res.send(user);
            }, function (err) {
                console.error(err);
            });
        });
    })
    .delete(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "USER_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.user.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });


module.exports = router;
