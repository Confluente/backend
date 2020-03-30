var express = require("express");
var Q = require("q");
var marked = require("marked");
var Sequelize = require("sequelize");
var permissions = require("../permissions");
var arrayHelper = require("../arrayHelper");
var Activity = require("../models/activity");
var Group = require("../models/group");
var User = require("../models/user");

var router = express.Router();
const Op = Sequelize.Op;

router.route("/")
    .get(function (req, res, next) {
        d = new Date();
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "approved", "subscriptionDeadline", "canSubscribe"],
            order: [
                ["date", "ASC"]
            ],
            where: {
                date: {[Op.between]: [d.setDate(d.getDate() - 1), new Date(2023, 1, 1)]}
            },
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }, {
                model: User,
                as: "participants",
                attributes: ["id", "displayName", "firstName", "lastName", "email"]
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
    // Creating a new activity
    .post(function (req, res, next) {
        let activity = req.body;

        if (!res.locals.session) {
            return res.sendStatus(401);
        }

        // check if fields are empty
        if (!activity.organizer || !activity.description || !activity.date || isNaN(Date.parse(activity.date))) {
            return res.sendStatus(400);
        }

        permissions.check(res.locals.session.user, {
            type: "GROUP_ORGANIZE",
            value: activity.organizer
        }).then(function (result) {
            if (!result) return res.sendStatus(403);

            // Format form correctly
            // Change all lists database strings
            if (activity.canSubscribe) {
                // transform lists to strings
                activity.typeOfQuestion = arrayHelper.stringifyArrayOfStrings(activity.typeOfQuestion);
                activity.questionDescriptions = arrayHelper.stringifyArrayOfStrings(activity.questionDescriptions);
                activity.formOptions = arrayHelper.stringifyArrayOfStrings(activity.options);
                activity.required = arrayHelper.stringifyArrayOfStrings(activity.required);
            }

            activity.OrganizerId = activity.organizer;

            return Activity.create(activity).then(function (result) {
                res.status(201).send(result);
            }).catch(function (err) {
                console.error(err);
            });
        }).done();
    });

// This route is for getting the activities for the manage page
// For the manage page, you should only get the activities which you are allowed to edit
router.route("/manage")
    .get(function (req, res, next) {
        d = new Date();
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "approved", "subscriptionDeadline"],
            order: [
                ["date", "ASC"]
            ],
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }]
        }).then(function (activities) {
            if (!res.locals.session) return res.sendStatus(403);
            var promises = activities.map(function (activity) {
                if (!res.locals.session) return Q(null);
                return permissions.check(res.locals.session.user, {
                    type: "ACTIVITY_EDIT",
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
    });

router.route("/subscriptions/:id")
    // adding a subscription to a specific activity
    .post(function (req, res, next) {
        // check if user is logged in
        var user = res.locals.session ? res.locals.session.user : null;
        if (user == null) return res.status(403).send({status: "Not logged in"});
        // get activity
        Activity.findByPk(req.params.id, {
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }]
        }).then(function (activity) {
            // format answer string
            let answerString = arrayHelper.stringifyArrayOfStrings(req.body);

            // add relation
            return User.findByPk(user).then(function (dbUser) {
                dbUser.addActivity(activity, {through: {answers: answerString}}).then(function (result) {
                    res.send(result);
                })
            });
        })
    })
    // deleting subscription to activity
    .delete(function (req, res) {
        // checking if user is logged in
        var userId = res.locals.session ? res.locals.session.user : null;
        if (userId == null) return res.status(403).send({status: "Not logged in"});
        // get activity
        Activity.findByPk(req.params.id, {
            include: [{
                model: User,
                as: "participants"
            }]
        }).then(function (activity) {
            // looping through all subscriptions to find the one of the user that requested the delete
            for (var i = 0; i < activity.dataValues.participants.length; i++) {
                if (activity.dataValues.participants[i].dataValues.id === userId) {
                    activity.dataValues.participants[i].dataValues.subscription.destroy();
                }
            }
            return res.send(201)
        }).done()
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        // getting specific activity from database
        Activity.findByPk(req.params.id, {
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]
            }, {
                model: User,
                as: "participants",
                attributes: ["id", "displayName", "firstName", "lastName", "email"]
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
    // Getting a specific activity
    .get(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null; // check if user is logged in
        permissions.check(user, {type: "ACTIVITY_VIEW", value: req.params.id}).then(function (result) {
            if (!result) return res.sendStatus(403);
            var activity = res.locals.activity;
            activity.dataValues.description_html = marked(activity.description);

            // formatting activity correctly for frontend
            if (activity.canSubscribe) {
                // split strings into lists
                activity.participants.forEach(function (participant) {
                    participant.subscription.answers = arrayHelper.destringifyStringifiedArrayOfStrings(participant.subscription.answers);
                });
                activity.typeOfQuestion = arrayHelper.destringifyStringifiedArrayOfStrings(activity.typeOfQuestion);
                activity.questionDescriptions = arrayHelper.destringifyStringifiedArrayOfStrings(activity.questionDescriptions);
                activity.formOptions = arrayHelper.destringifyStringifiedArrayOfStrings(activity.formOptions);
                activity.required = arrayHelper.destringifyStringifiedArrayOfStrings(activity.required);
                var newOptions = [];
                activity.formOptions.forEach(function (question) {
                    newOptions.push(question.split('#;#'));
                });
                activity.formOptions = newOptions;
            }

            res.send(activity);
        }).done();
    })
    // editing a specific activity
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            // Get the organizing group from the database
            Group.findOne({where: {displayName: req.body.organizer}}).then(function (group) {
                req.body.OrganizerId = group.id;
                req.body.Organizer = group;

                // formatting the subscription form into strings for the database
                req.body.typeOfQuestion = arrayHelper.stringifyArrayOfStrings(req.body.typeOfQuestion);
                req.body.questionDescriptions = arrayHelper.stringifyArrayOfStrings(req.body.questionDescriptions);
                req.body.formOptions = arrayHelper.stringifyArrayOfStrings(req.body.formOptions);
                req.body.required = arrayHelper.stringifyArrayOfStrings(req.body.required);

                return res.locals.activity.update(req.body).then(function (activity) {
                    res.send(activity);
                }, function (err) {
                    console.error(err);
                });
            });
        }).done();
    })
    // deleting a specific activity
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