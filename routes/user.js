var express = require("express");
const nodemailer = require("nodemailer");

var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");
var authHelper = require("../authHelper");

var router = express.Router();
var log = require("../logger");

router.route("/")
    // Get all users
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
        return User.create(req.body).then(function (result) {
            nodemailer.createTestAccount().then(function () {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    type: "SMTP",
                    host: "smtp.gmail.com",
                    secure: true,
                    // Never fill this password in and add it to git! Only filled in locally or on the server!
                    auth: {
                        user: 'web@hsaconfluente.nl',
                        pass: ''
                    }
                });
                const link = "https://www.hsaconfluente.nl/api/user/approve/" + req.body.approvingHash;
                transporter.sendMail({
                    from: '"website" <web@hsaconfluente.nl>',
                    to: req.body.email,
                    subject: "Registration H.S.A. Confluente",
                    text: "Thank you for making an account on our website hsaconfluente.nl! \n To fully activate your account, please visit this link: https://www.hsaconfluente.nl/api/user/approve/" + req.body.approvingHash,
                    html: "<h3>&nbsp;</h3><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td style=\"padding: 10px 0 30px 0;\"><table style=\"border: 1px solid #cccccc; border-collapse: collapse;\" border=\"0\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\"><tbody><tr><td style=\"padding: 40px 30px 40px 30px;\" bgcolor=\"#ffffff\"><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td style=\"color: #153643; font-family: Arial, sans-serif; font-size: 24px;\"><h3><strong>Hooray! Welcome to H.S.A. Confluente</strong></h3></td></tr><tr><td style=\"padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;\">Thank you for signing up to the website of H.S.A. Confluente at <a href=\"http://www.hsaconfluente.nl\">www.hsaconfluente.nl</a>. To activate your account on our website, please click the  <a href='" + link + "'>here!</a></td></tr><tr><td><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td valign=\"top\" width=\"260\"><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr style=\"height: 140px;\"><td style=\"padding: 25px 0px 0px; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px; height: 140px;\"><h4>Events</h4><p>Now that you have an account on the H.S.A. Confluente website, you can subscribe to all the wonderful events that H.S.A. Confluente is organizing. Want to see what activities are coming up? <a href=\"https://hsaconfluente.nl/activities\">Click here!</a></p></td></tr></tbody></table></td><td style=\"font-size: 0; line-height: 0;\" width=\"20\">&nbsp;</td><td valign=\"top\" width=\"260\"><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr style=\"height: 140px;\"><td style=\"padding: 25px 0px 0px; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px; height: 140px;\"><h4>Want to learn more?</h4><p>Are you interested in what H.S.A. Confluente is or can offer you? Then go and take an extensive look at our <a href=\"https://hsaconfluente.nl/\">website</a>! You can find pictures of all previous boards as well as information about what committees we have at H.S.A. Confluente!.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 30px 30px 30px 30px;\" bgcolor=\"#1689ad\"><table border=\"0\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tbody><tr><td style=\"color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;\" width=\"75%\">Web Commttee H.S.A. Confluente, TU/e 2020</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table>"
                }).then(function (info) {
                })
            });
            res.status(201).send(result);
        }).catch(function (err) {
            res.status(406).send("Account with identical email already exists");
        }).done();
    });

// Specific user route
router.route("/:id")
    .all(function (req, res, next) {
        var user = res.locals.session ? res.locals.session.user : null;
        if (user === null) return res.send(403);
        var id = req.params.id;
        User.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "displayName", "major", "address", "track", "honorsGeneration", "honorsMembership", "campusCardNumber", "mobilePhoneNumber", "email", "isAdmin", "consentWithPortraitRight"],
        }).then(function (user) {
            if (user === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                res.locals.user = user;
                next();
            }
        });
    })
    // Get specific user
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
                            res.locals.user.addGroups(specificGroup, {through: {func: groupData.role}}).then(console.log);
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

router.route("/approve/:approvalString")
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

        const approvalString = req.params.approvalString;
        if (approvalString.length !== 24) return res.send(401);
        User.findOne({where: {approvingHash: approvalString}}).then(function (user) {
            if (!user) {
                return res.sendStatus(404).send("Not found!")
            }

            user.update({approved: true, approvingHash: makeLink(23)}).then(function (result) {
                res.writeHead(301, {
                    'location': '/completed_registration'
                });
                res.send();
            })
        })
    });

module.exports = router;
