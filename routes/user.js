var express = require("express");
const nodemailer = require("nodemailer");

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
        var makeLink = function (length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        };

        if (!req.body.displayName || !req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }
        req.body.approvingHash = makeLink(24);
        req.body.passwordSalt = authHelper.generateSalt(16); // Create salt of 16 characters
        req.body.passwordHash = authHelper.getPasswordHashSync(req.body.password, req.body.passwordSalt); // Get password hash
        delete req.body.password; // Delete password permanently
        req.body.isAdmin = false;
        log.info({req: req.body}, "EVENTUAL REQUEST");
        return User.create(req.body).then(function (result) {
            nodemailer.createTestAccount().then(function () {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    type: "SMTP",
                    host: "smtp.gmail.com",
                    secure: true,
                    // Never fill this data in and add it to git! Only filled in locally or on the server!
                    auth: {
                        user: 'web@hsaconfluente.nl',
                        pass: ''
                    }
                });
                const link = "www.hsaconfluente.nl/api/user/approve/" + req.body.approvingHash;
                transporter.sendMail({
                    from: '"website" <web@hsaconfluente.nl>',
                    to: req.body.email,
                    subject: "Registration H.S.A. Confluente",
                    text: "Thank you for making an account on our website hsaconfluente.nl! \n To fully activate your account, please visit this link: www.hsaconfluente.nl/api/user/approve/" + req.body.approvingHash,
                    html: "Thank you for making an account on our website hsaconfluente.nl! To fully activate your account, please click <a href='" + link + "'>here!</a>"
                }).then(function (info) {
                    console.log("message sent: %s", info.messageId);
                    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                })
            });
            res.status(201).send(result);
        }).catch(function (err) {
            console.error(err);
        }).done();
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        User.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "displayName", "major", "track", "honorsGeneration", "campusCardNumber", "mobilePhoneNumber", "email", "isAdmin", "consentWithPortraitRight"],
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

router.route("/approve/:approvalS")
    .all(function (req, res) {
        var makeLink = function (length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        };

        const approvalString = req.params.approvalS;
        if (approvalString.length !== 24) return res.send(401);
        User.findOne({where: {approvingHash: approvalString}}).then(function (user) {
            if (!user) {
                return res.sendStatus(404).send("Not found!")
            }

            user.update({approved: true, approvingHash: makeLink(23)}).then(function (result) {
                console.log("succes!!");
                console.log(result);
                res.writeHead(301, {
                    'location': '/completed_registration'
                });
                res.send();
            })
        })
    });

module.exports = router;
