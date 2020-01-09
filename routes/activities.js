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
        d = new Date();
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "approved"],
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
        let activity = req.body;

        if (!res.locals.session) {
            return res.sendStatus(401);
        }
        if (!activity.organizer || !activity.description || !activity.date || isNaN(Date.parse(activity.date))) {
            return res.sendStatus(400);
        }

        permissions.check(res.locals.session.user, {
            type: "GROUP_ORGANIZE",
            value: activity.organizer
        }).then(function (result) {
            // Convert lists of form to strings
            let titlesOfQuestions = "name,TU/e email";
            let typeOfQuestion = "name,TU/e email";
            let questionDescriptions = "Name,TU/e Email";
            let formOptions = ",";
            let required = "true,true";
            if (activity.canSubscribe) {
                for (let i = 0; i < activity.numberOfQuestions; i++) {
                    titlesOfQuestions += "," + activity.titlesOfQuestions[i];
                    typeOfQuestion += "," + activity.typeOfQuestion[i];
                    questionDescriptions += "," + activity.questionDescriptions[i];
                    formOptions += "," + activity.options[i];
                    required += "," + activity.required[i];
                }
            }

            activity.titlesOfQuestions = titlesOfQuestions;
            activity.typeOfQuestion = typeOfQuestion;
            activity.questionDescriptions = questionDescriptions;
            activity.formOptions = formOptions;
            activity.required = required;
            activity.numberOfQuestions += 2;

            if (!result) return res.sendStatus(403);
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
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "approved"],
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
            let answerString = req.body[0];
            for (var i = 1; i < activity.numberOfQuestions; i++) {
                    answerString += "," + req.body[i];
            }
            return User.findByPk(user).then(function (dbUser) {
                dbUser.addActivity(activity, {through: {answers: answerString}}).then(function (result) {
                    res.send(result);
                })
            });
        })
    });

router.route("/:id")
    .all(function (req, res, next) {
        var id = req.params.id;
        Activity.findByPk(req.params.id, {
            include: [{
                model: Group,
                as: "Organizer",
                attributes: ["id", "displayName", "fullName", "email"]

            }, {
                model: User,
                as: "participants"
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
            if (activity.canSubscribe) {
                activity.participants.forEach(function (participant) {
                    participant.subscription.answers = participant.subscription.answers.split(',');
                });

                activity.titlesOfQuestions = activity.titlesOfQuestions.split(',');
                activity.typeOfQuestion = activity.typeOfQuestion.split(',');
                activity.questionDescriptions = activity.questionDescriptions.split(',');
                activity.formOptions = activity.formOptions.split(',');
                activity.required = activity.required.split(',');
                var newOptions = [];
                activity.formOptions.forEach(function (question) {
                    newOptions.push(question.split(';'));
                });
                activity.formOptions = newOptions;
            }
            res.send(activity);
        }).done();
    })
    .put(function (req, res) {
        var user = res.locals.session ? res.locals.session.user : null;
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            let titlesOfQuestions = "name,TU/e email";
            let typeOfQuestion = "name,TU/e email";
            let questionDescriptions = "Name,TU/e Email";
            let formOptions = ",";
            let required = "true,true";
            if (req.body.canSubscribe) {
                for (let i = 0; i < req.body.numberOfQuestions; i++) {
                    titlesOfQuestions += "," + req.body.titlesOfQuestions[i];
                    typeOfQuestion += "," + req.body.typeOfQuestion[i];
                    questionDescriptions += "," + req.body.questionDescriptions[i];
                    formOptions += "," + req.body.formOptions[i];
                    required += "," + req.body.required[i];
                }
                req.body.titlesOfQuestions = titlesOfQuestions;
                req.body.typeOfQuestion = typeOfQuestion;
                req.body.questionDescriptions = questionDescriptions;
                req.body.formOptions = formOptions;
                req.body.required = required;
                req.body.numberOfQuestions += 2;
            }
            return res.locals.activity.update(req.body).then(function (activity) {
                res.send(activity);
            }, function (err) {
                console.error(err);
            });
        }).done();
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