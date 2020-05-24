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
var Op = Sequelize.Op;

router.route("/")
    /*
     * Gets every activity in the database happening from today onwards
     */
    .get(function (req, res, next) {

        // Get all ativities from the database
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "published", "subscriptionDeadline", "canSubscribe"],
            order: [
                ["date", "ASC"]
            ],
            where: {
                date: {[
                    Op.between]: [new Date().setDate(new Date().getDate() - 1),
                        new Date().setFullYear(new Date().getFullYear() + 10)
                    ]}
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

            // Check for every activity if the client can view them
            var promises = activities.map(function (activity) {

                // If the activity is published, everyone (also not logged in) is allowed to see them
                if (activity.published) return Q(activity);

                // If not logged in (and unpublished), client has no permission
                if (!res.locals.session) return Q(null);

                // If logged in (and unpublished), check whether client has permission to view activity
                return permissions.check(res.locals.session.user, {
                    type: "ACTIVITY_VIEW",
                    value: activity.id
                }).then(function (result) {

                    // If no permission, return null, otherwise return activity
                    return result ? activity : null;
                });
            });

            Q.all(promises).then(function (activities) {

                // Filter out all null events
                activities = activities.filter(function (e) {
                    return e !== null;
                });

                // For each activity in activities, enable markdown for description
                activities = activities.map(function (activity) {
                    activity.dataValues.description_html = marked(activity.description || "");
                    return activity;
                });

                // Send activities to the client
                res.send(activities);
            }).done();
        });
    })
    /**
     * Creates a new activity.
     */
    .post(function (req, res, next) {

        // Check whether the client is logged in
        if (!res.locals.session) {
            return res.sendStatus(401);
        }

        // Store activity in variable
        let activity = req.body;

        // Check if mandatory fields are filled in
        if (!activity.organizer || !activity.description || !activity.date || isNaN(Date.parse(activity.date))) {
            return res.sendStatus(400);
        }

        // Check whether the client has permission to organize events
        permissions.check(res.locals.session.user, {
            type: "GROUP_ORGANIZE",
            value: activity.organizer
        }).then(function (result) {

            // If no permission, send 403
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

            // Set organizerId
            activity.OrganizerId = activity.organizer;

            // Create activity in database
            return Activity.create(activity).then(function (result) {

                // Send new activity back to the client
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
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "published", "subscriptionDeadline"],
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

                if (req.body.canSubscribe) {
                    // formatting the subscription form into strings for the database
                    req.body.typeOfQuestion = arrayHelper.stringifyArrayOfStrings(req.body.typeOfQuestion);
                    req.body.questionDescriptions = arrayHelper.stringifyArrayOfStrings(req.body.questionDescriptions);
                    req.body.formOptions = arrayHelper.stringifyArrayOfStrings(req.body.formOptions);
                    req.body.required = arrayHelper.stringifyArrayOfStrings(req.body.required);
                }

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