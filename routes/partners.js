var express = require("express");

var permissions = require("../permissions");
var companyOpportunities = require("../models/companyOpportunity");

var router = express.Router();

router.route("/companyOpportunities")
    .get(function (req, res) {
        /**
         * Route for getting all companyOpportunities from the database.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "COMPANY_OPPORTUNITY_VIEW"}).then(function (result) {
            if (!result) {
                res.status(403).send("You do not have the permissions to view internships");
            }

            companyOpportunities.findAll({
                order: [
                    ["id", "ASC"]
                ]
            }).then(function (results) {
                console.log(results);
                res.send(results);
            })
        })
    })
    .post(function (req, res) {
        /**
         * Route for creating a company opportunity.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "COMPANY_OPPORTUNITY_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                res.status(403).send("You do not have permissions to create a company opportunity");
            }

            return companyOpportunities.create(req.body).then(function (companyOpportunity) {
                res.status(201).send(companyOpportunity);
            }).catch(function (err) {
                console.error(err);
                res.sendStatus(400).send("Something went wrong in creating the company opportunity. " +
                    "Check the logs for a detailed message.")
            })
        })
    });

router.route("/companyOpportunities/:id")
    .all(function (req, res, next) {
        companyOpportunities.findByPk(req.params.id).then(function (companyOpportunity) {
            if (companyOpportunity === null) {
                res.status(404).send({status: "Company opportunity could not be found in the database."});
            } else {
                res.locals.companyOpportunity = companyOpportunity;
                next();
            }
        })
    })
    .get(function (req, res) {
        /**
         * Route for getting a specific company opportunity.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "COMPANY_OPPORTUNITY_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            res.send(res.locals.companyOpportunity);
        }).done();
    })
    .put(function (req, res) {
        /**
         * Route for editing a specific company opportunity.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "COMPANY_OPPORTUNITY_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            return res.locals.companyOpportunity.update(req.body).then(function (companyOpportunity) {
                res.send(companyOpportunity);
            }, function (err) {
                console.error("Could not update company opportunity with id " + res.locals.companyOpportunity.id);
                console.error(err);
            })
        })
    })
    .delete(function (req, res) {
        /**
         * Route for deleting a company opportunity.
         */
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "COMPANY_OPPORTUNITY_MANAGE", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            return res.locals.companyOpportunity.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"})
        })
    });

router.route("/companyOpportunities/category/:category")
    /**
     * Gets all company opportunities of a certain category from the database.
     */
    .get(function (req, res) {
        companyOpportunities.findAll({
            where: {category: req.params.category}
        }).then(function (companyOpportunities) {
            res.send(companyOpportunities);
        });
    });

module.exports = router;
