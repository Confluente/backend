var express = require("express");
var nodemailer = require("nodemailer");
var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");
var authHelper = require("../authHelper");

var router = express.Router();

router.route("/")
    /**
     * Gets all users from the database
     */
    .get(function (req, res, next) {
        // Check if the client is logged in
        var userId = res.locals.session ? res.locals.session.user : null;

        // Check if the client has permission to manage users
        permissions.check(userId, {
            type: "USER_MANAGE",
            value: userId
        }).then(function (result) {
            // If no result, then the client has no permission
            if (!result) res.sendStatus(403);

            // If client has permission, find all users in database
            User.findAll({
                attributes: ["id", "displayName", "email", "isAdmin"],
                order: [
                    ["id", "ASC"]
                ]
            }).then(function (results) {
                // Send the users back to the client
                res.send(results);
            });
        }).done();
    })

    /**
     * Creates a new user in the database
     */
    .post(function (req, res, next) {
        // Check if required fields are filled in
        if (!req.body.displayName || !req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }

        // generate approvingHash, passwordSalt and passwordHash
        req.body.approvingHash = authHelper.generateSalt(24);
        req.body.passwordSalt = authHelper.generateSalt(16);
        req.body.passwordHash = authHelper.getPasswordHashSync(req.body.password, req.body.passwordSalt);

        // Delete password permanently
        delete req.body.password;

        // Set admin status false
        req.body.isAdmin = false;

        // Create new user in database
        return User.create(req.body).then(function (result) {
            // Send approval email to email
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
    /**
     * Gets the user and stores it in res.locals.user
     * @param id of the user that client wants
     */
    .all(function (req, res, next) {
        // Check if client has a session
        var user = res.locals.session ? res.locals.session.user : null;

        // If client does not have a session, he does not have permission
        if (user === null) return res.send(403);

        // Get user from database
        User.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "displayName", "major", "address", "track", "honorsGeneration", "honorsMembership", "campusCardNumber", "mobilePhoneNumber", "email", "isAdmin", "consentWithPortraitRight"],
        }).then(function (user) {
            // Return if user not found
            if (user === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                // Store user and go to next function
                res.locals.user = user;

                next();
            }
        });
    })

    /**
     * Get a specific user from the database and return to the client
     */
    .get(function (req, res) {
        // store user in variable
        var user = res.locals.session.user;

        // Check whether user has permission to see the information of the user requested
        permissions.check(user, {type: "USER_VIEW", value: req.params.id}).then(function (result) {
            // If no permission, return 403
            if (!result) return res.sendStatus(403);

            // If permission, find all groups in the database, that the requested user is a member of.
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
            }).then(function (dbGroups) {
                // Send user together with group back to client
                res.send([res.locals.user, dbGroups])
            });
        });
    })

    /**
     * Edit a user
     */
    .put(function (req, res) {
        // Store user in variable
        var user = res.locals.session.user

        // Check whether the client has permission to manage (edit) users
        permissions.check(user, {
            type: "USER_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            // If no permission, send 403
            if (!result) {
                return res.sendStatus(403);
            }

            // Find all groups that the user edited is currently a member of
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
                // Remove all existing group relations from the database
                var i;
                for (i = 0; i < group.length; i++) {
                    group[i].members[0].user_group.destroy();
                }

                // Add all groups as stated in the request
                req.body[1].forEach(function (groupData) {
                    if (groupData.selected) {
                        Group.findByPk(groupData.id).then(function (specificGroup) {
                            res.locals.user.addGroups(specificGroup, {through: {func: groupData.role}}).then(console.log);
                        })
                    }
                });

                // Update the user in the database
                return res.locals.user.update(req.body[0]).then(function (user) {
                    // Send edited user back to the client.
                    res.send(user);
                }, function (err) {
                    console.error(err);
                });
            }).done();

        });
    })

    /**
     * Delete user from the database
     */
    .delete(function (req, res) {
        // Store user in variable
        var user = res.locals.session.user

        // Check if client has the permission to manage (delete) users
        permissions.check(user, {
            type: "USER_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Destory user in database
            return res.locals.user.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });

router.route("/changePassword/:id")
    /**
     * Change the password of a user
     */
    .put(function (req, res) {
        // Check if client has a session
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to change password of user
        permissions.check(user, {type: "CHANGE_PASSWORD", value: req.params.id}).then(function (result) {
            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Get user from database
            User.findByPk(req.params.id, {
                attributes: ["id", "displayName", "email", "isAdmin", "passwordHash", "passwordSalt"],
            }).then(function (userFound) {
                // If user does not exist, send 404
                if (userFound === null) {
                    return res.status(404).send({status: "Not Found"});
                } else {
                    // Get the hash of the (original) password the user put
                    var inputtedPasswordHash = authHelper.getPasswordHashSync(req.body.password, userFound.passwordSalt);

                    // Check if it is indeed the correct password
                    if (Buffer.compare(inputtedPasswordHash, userFound.passwordHash) !== 0) {
                        return res.status(406).send({status: "Not equal passwords"});
                    }

                    // Check if both newly inputted passwords are the same
                    if (req.body.passwordNew !== req.body.passwordNew2) {
                        return res.status(406).send({status: "Not equal new passwords"});
                    }

                    // Generate new salt and hash
                    var passwordSalt = authHelper.generateSalt(16); // Create salt of 16 characters
                    var passwordHash = authHelper.getPasswordHashSync(req.body.passwordNew, passwordSalt); // Get password hash

                    // Update user in database with new password and hash
                    return userFound.update({
                        passwordHash: passwordHash,
                        passwordSalt: passwordSalt
                    }).then(function (user) {
                        // Send updated user to the client
                        return res.send(user);
                    }, function (err) {
                        console.error(err);
                    })
                }
            }).done();
        });
    });

router.route("/approve/:approvalString")
    /**
     * Function for approving a user account based on the approvalString
     */
    .all(function (req, res) {
        // Get the approval string
        const approvalString = req.params.approvalString;

        // Check if it has the correct length
        if (approvalString.length !== 24) {
            return res.send(401);
        }

        // Find the user in the database of which this link is
        User.findOne({where: {approvingHash: approvalString}}).then(function (user) {
            if (!user) {
                // If the same link is clicked again in the email
                res.writeHead(301, {
                    'location': '/login'
                });
                res.send();
            }

            user.update({approved: true, approvingHash: authHelper.generateSalt(23)}).then(function (result) {
                res.writeHead(301, {
                    'location': '/completed_registration'
                });
                res.send();
            })
        })
    });

module.exports = router;
