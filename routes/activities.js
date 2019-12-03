var express = require("express");
var Q = require("q");
var marked = require("marked");
var Sequelize = require("sequelize");
var permissions = require("../permissions");
var Activity = require("../models/activity");
var Group = require("../models/group");
var User = require("../models/user");

var router = express.Router();
const Op = Sequelize.Op;

router.route("/")
    .get(function (req, res, next) {
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "approved"],
            order: [
                ["date", "ASC"]
            ],
            where: {
                date: {[Op.between]: [new Date(), new Date(2023, 1, 1)]}
            },
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }]
        }).then(function (activities) {
            var promises = activities.map(function (activity) {
                if (activity.approved) return Q(activity);
                if (!res.locals.session) return Q(null);
                return permissions.check(res.locals.session.user, {
                    type: "ACTIVITY_VIEW",
                    value: activity.id
                }).then(function (result) {
                    return result ? activity : null;
                });
            });
            Q.all(promises).then(function (activities) {
                activities = activities.filter(function (e) {
                    return e !== null;
                });
                activities = activities.map(function (activity) {
                    activity.dataValues.description_html = marked(activity.description || "");
                    return activity;
                });
                res.send(activities);
            }).done();
        });
    })
    .post(function (req, res, next) {
        if (!res.locals.session) {
            return res.sendStatus(401);
        }
        if (!req.body.organizer || !req.body.description || !req.body.date || isNaN(Date.parse(req.body.date))) {
            return res.sendStatus(400);
        }

        permissions.check(res.locals.session.user, {
            type: "GROUP_ORGANIZE",
            value: req.body.organizer
        }).then(function (result) {
            if (!result) return res.sendStatus(403);
            req.body.OrganizerId = req.body.organizer;
            return Activity.create(req.body).then(function (result) {
                res.status(201).send(result);
            }).catch(function (err) {
                console.error(err);
            });
        }).done();
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        Activity.findByPk(req.params.id, {
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }]
        }).then(function (activity) {
            if (activity === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                res.locals.activity = activity;
                next();
            }
        });
    })
    .get(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {type: "ACTIVITY_VIEW", value: req.params.id}).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            var activity = res.locals.activity;
            activity.dataValues.description_html = marked(activity.description);
            res.send(activity);
        });
    })
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        //permissions.check(user, {type: "ACTIVITY_APPROVE"});
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.activity.update(req.body).then(function (activity) {
                res.send(activity);
            }, function (err) {
                console.error(err);
            });
        });
    })
    .delete(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return res.locals.activity.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });

module.exports = router;