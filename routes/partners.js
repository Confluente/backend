var express = require("express");

var permissions = require("../permissions");
var internships = require("../models/companyOpportunity");

var router = express.Router();

router.route("/internships")
    .all(permissions.requireAll({type: "INTERNSHIP_MANAGE"}))
    .get(function (req, res) {
        internships.findAll({
            order: [
                ["id", "ASC"]
            ]
        }).then(function (results) {
            res.send(results);
        })
    })
    .post(function (req, res) {
        return internships.create(req.body).then(function (result) {
            res.status(201).send(result);
        }).catch(function (err) {
            console.error(err);
            res.sendStatus(400).send("Something went wrong in creating the internship. " +
                "Check the logs for a detailed message.")
        })
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
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "INTERNSHIP_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            res.send(res.locals.internship);
        }).done();
    })
    .put(function (req, res) {
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

module.exports = router;