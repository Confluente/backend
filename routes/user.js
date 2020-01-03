var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");
var authHelper = require("../authHelper");

var router = express.Router();
var log = require("../logger");

router.route("/")
// .all(permissions.requireAll({type: "USER_MANAGE"}))
    .get(function (req, res, next) {
        var userId = res.locals.session ? res.locals.session.user : null;
        permissions.check(userId, {
            type: "USER_MANAGE",
            value: userId
        }).then(function (result) {
            if (!result) res.sendStatus(403);
            User.findAll({
                attributes: ["id", "displayName", "email", "isAdmin"],
                order: [
                    ["id", "ASC"]
                ]
            }).then(function (results) {
                res.send(results);
            });
        }).done();
    })
    .post(function (req, res, next) {
        log.info({req: req.body}, "INITIAL REQUEST");
        if (!req.body.displayName || !req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }

        req.body.passwordSalt = authHelper.generateSalt(16); // Create salt of 16 characters
        req.body.passwordHash = authHelper.getPasswordHashSync(req.body.password, req.body.passwordSalt); // Get password hash
        delete req.body.password; // Delete password permanently
        req.body.isAdmin = false;
        log.info({req: req.body}, "EVENTUAL REQUEST");
        return User.create(req.body).then(function (result) {
            res.status(201).send(result);
        }).catch(function (err) {
            console.error(err);
        }).done();
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        User.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "major", "track", "honorsGeneration", "campusCardNumber", "mobilePhoneNumber", "email", "isAdmin"],
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
                    var groups = group;
                    var user = res.locals.user;
                    res.send([user, groups]);
                }
            });
        });
    })
    .put(function (req, res) {
        // console.log(req.body[1]); // prints all groups and if they were selected
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "USER_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
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
                var i;
                for (i = 0; i < group.length; i++) {
                    group[i].members[0].user_group.destroy();
                }

                req.body[1].forEach(function (groupData) {
                    if (groupData.selected) {
                        Group.findByPk(groupData.id).then(function (specificGroup) {
                            res.locals.user.addGroups(specificGroup).then(console.log);
                        })
                    }
                });
                return res.locals.user.update(req.body[0]).then(function (user) {
                    res.send(user);
                }, function (err) {
                    console.error(err);
                });
            }).done();

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

router.route("/changePassword/:id")
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "CHANGE_PASSWORD", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            User.findByPk(req.params.id, {
                attributes: ["id", "displayName", "email", "isAdmin", "passwordHash", "passwordSalt"],
            }).then(function (userFound) {
                if (userFound === null) {
                    return res.status(404).send({status: "Not Found"});
                } else {
                    var inputtedPassword = authHelper.getPasswordHashSync(req.body.password, userFound.passwordSalt);

                    if (Buffer.compare(inputtedPassword, userFound.passwordHash) !== 0) {
                        return res.status(406).send({status: "Not equal passwords"});
                    }
                    if (req.body.passwordNew !== req.body.passwordNew2) {
                        return res.status(406).send({status: "Not equal new passwords"});
                    }
                    var passwordSal = authHelper.generateSalt(16); // Create salt of 16 characters
                    var passwordHas = authHelper.getPasswordHashSync(req.body.passwordNew, passwordSal); // Get password hash

                    return userFound.update({
                        passwordHash: passwordHas,
                        passwordSalt: passwordSal
                    }).then(function (user) {
                        return res.send(user);
                    }, function (err) {
                        console.error(err);
                    })
                }
            }).done();
        });
    });

module.exports = router;
