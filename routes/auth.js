var express = require("express");

var User = require("../models/user");
var Group = require("../models/group");
var authHelper = require("../helpers/authHelper");

var router = express.Router();

router.route("/")
    /**
     * Function for getting the profile of the user.
     */
    .get(function (req, res, next) {
        // Check whether the response has a session (handled by express)
        if (!res.locals.session) {
            return res.sendStatus(401);
        }

        // find the user of the session in the database
        User.findByPk(res.locals.session.user, {
            attributes: ["id", "email", "displayName", "isAdmin", "consentWithPortraitRight"],
            include: [{
                model: Group,
                attributes: ["id", "displayName", "fullname", "description", "canOrganize", "email"]
            }]
        }).then(function (user) {
            // get the datavalues of the user
            var profile = user.dataValues;

            // set whether the user can organize activities
            profile.canOrganize = profile.isAdmin || profile.groups.some(function (e) {
                return e.canOrganize;
            });

            // send the profile back the client
            res.send(profile);
        });
    });

router.route("/login")
    /**
     * Function for logging a user in.
     */
    .post(function (req, res, next) {
        // Check if both the email and password field were filled in
        if (!req.body.email || !req.body.password) {
            return res.sendStatus(400);
        }

        // initialize variables
        var credentials = {
            email: req.body.email,
            password: req.body.password
        };

        // authenticate user
        authHelper.authenticate(req.body.email, req.body.password).then(function (user) {
            // check if error occurred
            if (user.error === 406) {
                return res.status(406).send(user)
            }

            // check if user account is approved
            if (user.approved === false) {
                return res.status(406).send({error: 406, data: "User account has not yet been approved"});
            }

            res.locals.user = user;

            // start a new session and send that session back to the client
            return authHelper.startSession(user.id, req.ip)
                .then(function (session) {
                    res.cookie('session', session.token.toString("base64"));
                    res.send(session);
                });
        }).catch(function (err) {
            //throw err
            return res.status(500).send({error: err});
        });
    });

module.exports = router;
