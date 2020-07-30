var express = require("express");

var permissions = require("../permissions");
var internships = require("../models/companyOpportunity");

var router = express.Router();

router.route("/internships")
    .get(function (req, res) {
        /**
         * Route for getting all internships from the database.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_VIEW"}).then(function (result) {
            if (!result) {
                res.status(403).send("You are not allowed to get all internships");
            }

            internships.findAll({
                order: [
                    ["id", "ASC"]
                ]
            }).then(function (results) {
                res.send(results);
            })
        })
    })
    .post(function (req, res) {
        /**
         * Route for creating an internship.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                res.status(403).send("You do not have permissions to create an internship");
            }

            return internships.create(req.body).then(function (internship) {
                res.status(201).send(internship);
            }).catch(function (err) {
                console.error(err);
                res.sendStatus(400).send("Something went wrong in creating the internship. " +
                    "Check the logs for a detailed message.")
            })
        }
    })

router.route("/internships/:id")
    .all(function (req, res, next) {
        internships.findByPk(req.params.id).then(function (internship) {
            if (internship === null) {
                res.status(404).send({status: "Internship could not be found in the database."});
            } else {
                res.locals.internship = internship;
                next();
            }
        })
    })
    .get(function (req, res) {
        /**
         * Route for getting a specific internship.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            res.send(res.locals.internship);
        }).done();
    })
    .put(function (req, res) {
        /**
         * Route for editing a specific internship.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            return res.locals.internship.update(req.body).then(function (internship) {
                res.send(internship);
            }, function (err) {
                console.error("Could not update internship with id " + res.locals.internship.id);
                console.error(err);
            })
        })
    })
    .delete(function (req, res) {
        /**
         * Route for deleting an internship.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            return res.locals.internship.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"})
        })
    })

module.exports = router;