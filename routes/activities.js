var express = require("express");
var Q = require("q");
var marked = require("marked");
var Sequelize = require("sequelize");
var permissions = require("../permissions");
var arrayHelper = require("../arrayHelper");
var Activity = require("../models/activity");
var Group = require("../models/group");
var User = require("../models/user");
var multer = require("multer");
var mime = require('mime-types');
var fs = require('fs');

var router = express.Router();
let Op = Sequelize.Op;

// path where the pictures of the activities are put in in frontend
let pathToPictures = '';
if (process.env.NODE_ENV === "production") {
    pathToPictures = 'dist/frontend/assets/img/activities/'
} else {
    // This is the standard (development or test mode)
    pathToPictures = '../Frontend-Angular/src/assets/img/activities/'
}

// Set The Storage Engine
let storage = multer.diskStorage({
    destination: pathToPictures,
    filename: function (req, file, cb) {
        cb(null, req.params.id + "." + mime.extension(file.mimetype));
    }
});

// Init Upload
let upload = multer({
    storage: storage,
    limits: {fileSize: 1000000}, // 1 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single("image");

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    let filetypes = /jpeg|jpg|png/;
    // Check mime
    let mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Deletes a picture of an activity given an id
function deletePicture(id) {
    var files = fs.readdirSync(pathToPictures);
    for (var i = 0; i < files.length; i++) {
        if (files[i].split(".")[0].toString() === id.toString()) {
            fs.unlinkSync(pathToPictures + files[i]);
            break;
        }
    }
}

// This route is for handling general operations for activities. Namely, getting all activities and creating a
// new activity.
router.route("/")
    /**
     * Gets every activity in the database happening from today onwards
     */
    .get(function (req, res, next) {
        // Get all activities from the database
        Activity.findAll({
            attributes: ["id", "name", "description", "location", "date", "startTime", "endTime", "published", "subscriptionDeadline", "canSubscribe", "hasCoverImage"],
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
                // These lines are needed not to crash the management table in some cases
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
                activity.privacyOfQuestions = arrayHelper.stringifyArrayOfStrings(activity.privacyOfQuestions);
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

// This route is for handling pictures on activities.
router.route("/pictures/:id")
    /**
     * Checks permissions for handling pictures for activity
     */
    .all(function (req, res, next) {
        // check for people to be logged in
        if (!res.locals.session) {
            return res.sendStatus(401);
        }

        // Check permissions
        return permissions.check(res.locals.session.user, {
            type: "ACTIVITY_EDIT",
            value: req.params.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            next();
        });
    })

    /**
     * Uploads a picture
     */
    .post(function (req, res, next) {
        upload(req, res, function(result) {
            res.send();
        })
    })

    /**
     * Edits a picture
     */
    .put(function (req, res, next) {
        // delete old picture
        deletePicture(req.params.id);

        upload(req, res, function(result) {
            res.send({Successful: true})
        })
    });

// This route is for getting the activities for the manage page
// For the manage page, you should only get the activities which you are allowed to edit
router.route("/manage")
    /*
     * Gets all activities for the manage page.
     * @return List of activities that the client is allowed to edit
     */
    .get(function (req, res, next) {
        // Get all activities from the database
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
            // For every activity, check if the client is allowed to edit it
            var promises = activities.map(function (activity) {
                return permissions.check(res.locals.session.user, {
                    type: "ACTIVITY_EDIT",
                    value: activity.id
                }).then(function (result) {
                    return result ? activity : null;
                });
            });

            Q.all(promises).then(function (activities) {
                // Filter all activities out that are null due to limited permission
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
    });

// This route is for handling subscriptions on activities.
router.route("/subscriptions/:id")
    /*
     * Adds a subscription to a specific activity
     */
    .post(function (req, res, next) {
        // check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // If client is not logged in, send 403
        if (user == null) return res.status(403).send({status: "Not logged in"});

        // Get activity from database
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

                    // Send relation back to the client
                    res.send(result);
                })
            });
        })
    })

    /**
     * Deletes a subscription from an activity
     */
    .delete(function (req, res) {
        // checking if client is logged in
        var userId = res.locals.session ? res.locals.session.user : null;

        // If client is not logged in, send 403
        if (userId == null) return res.status(403).send({status: "Not logged in"});

        // Get activity from database
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

            // Send confirmation to client
            return res.send(200)
        }).done()
    });

// This route is for handling activity specific operations such as getting an activity, editing an activity and
// removing an activity.
router.route("/:id")
    /**
     * Gets activity with id from database and stores it in res.locals.activity
     */
    .all(function (req, res, next) {
        // Getting specific activity from database
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
            // If activity not found, send 404
            if (activity === null) {
                res.status(404).send({status: "Not Found"});
            } else {
                // Store activity
                res.locals.activity = activity;

                next();
            }
        }).done();
    })

    /**
     * Sends specific activity to the client
     */
    .get(function (req, res) {
        // Check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to view the activity
        permissions.check(user, {type: "ACTIVITY_VIEW", value: req.params.id}).then(function (result) {
            // If no permission, send 403
            if (!result) return res.sendStatus(403);

            // Store activity in variable
            var activity = res.locals.activity;

            // Enable markdown
            activity.dataValues.description_html = marked(activity.description);

            // formatting activity correctly for frontend
            if (activity.canSubscribe) {
                // split strings into lists
                activity.participants.forEach(function (participant) {
                    participant.subscription.answers = arrayHelper
                        .destringifyStringifiedArrayOfStrings(participant.subscription.answers);
                });

                activity.typeOfQuestion = arrayHelper
                    .destringifyStringifiedArrayOfStrings(activity.typeOfQuestion);
                activity.questionDescriptions = arrayHelper
                    .destringifyStringifiedArrayOfStrings(activity.questionDescriptions);
                activity.formOptions = arrayHelper
                    .destringifyStringifiedArrayOfStrings(activity.formOptions);
                activity.required = arrayHelper
                    .destringifyStringifiedArrayOfStrings(activity.required);
                activity.privacyOfQuestions = arrayHelper
                    .destringifyStringifiedArrayOfStrings(activity.privacyOfQuestions);
                var newOptions = [];
                activity.formOptions.forEach(function (question) {
                    newOptions.push(question.split('#;#'));
                });

                activity.formOptions = newOptions;
            }

            // Send activity to client
            if (activity.hasCoverImage) {
                var files = fs.readdirSync(pathToPictures);
                for (var i = 0; i < files.length; i++) {
                    if (files[i].split(".")[0].toString() === activity.id.toString()) {
                        activity.dataValues.coverImage = files[i];
                    }
                }
            }

            res.send(activity);
        }).done();
    })

    /**
     * Edits a specific activity
     */
    .put(function (req, res) {
        // Check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to edit the activity
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Get the organizing group from the database
            Group.findOne({where: {fullName: req.body.organizer}}).then(function (group) {
                req.body.OrganizerId = group.id;
                req.body.Organizer = group;

                // Update the activity in the database
                if (req.body.canSubscribe) {
                    // formatting the subscription form into strings for the database
                    req.body.typeOfQuestion = arrayHelper
                        .stringifyArrayOfStrings(req.body.typeOfQuestion);
                    req.body.questionDescriptions = arrayHelper
                        .stringifyArrayOfStrings(req.body.questionDescriptions);
                    req.body.formOptions = arrayHelper
                        .stringifyArrayOfStrings(req.body.formOptions);
                    req.body.required = arrayHelper
                        .stringifyArrayOfStrings(req.body.required);
                    req.body.privacyOfQuestions = arrayHelper
                        .stringifyArrayOfStrings(req.body.privacyOfQuestions);
                }

                return res.locals.activity.update(req.body).then(function (activity) {
                    res.send(activity);
                }, function (err) {
                    console.error(err);
                });
            });
        }).done();
    })

    /*
     * Deletes a specific activity
     */
    .delete(function (req, res) {
        // Check if the client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if the client has permission to edit the activity
        permissions.check(user, {
            type: "ACTIVITY_EDIT",
            value: res.locals.activity.id
        }).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }

            // Delete cover image
            if (res.locals.activity.hasCoverImage) {
                deletePicture(res.locals.activity.id);
            }

            // Delete activity from database
            return res.locals.activity.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });

module.exports = router;
