var express = require("express");

var permissions = require("../permissions");
var internships = require("../models/internship");

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
    .all(permissions.requireAll({type: "INTERNSHIP_MANAGE"}))

module.exports = router;