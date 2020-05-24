var express = require("express");
var User = require("../models/user");
var Group = require("../models/group");
var permissions = require("../permissions");

var router = express.Router();

router.route("/")
    .all(permissions.requireAll({type: "GROUP_MANAGE"}))
    /**
     * Gets all groups from the database
     */
    .get(function (req, res, next) {
        Group.findAll({
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize", "type"],
            order: [
                ["id", "ASC"]
            ]
        }).then(function (groups) {

            // Sends the groups back to the client
            res.send(groups);
        });
    })
    /**
     * Creates a new group
     */
    .post(function (req, res, next) {

        // Checks if the client is logged in
        if (!res.locals.session) return res.sendStatus(401)

        // Checks if all required fields are filled in
        if (!req.body.displayName || !req.body.fullName || !req.body.description || !req.body.email) {
            return res.sendStatus(400);
        }

        // Checks if the client has permission to create a group
        permissions.check(res.locals.session.user, {
            type: "GROUP_CREATE",
            value: req.body.organizer
        }).then(function (result) {

            // If no permission, send 403
            if (!result) return res.sendStatus(403);

            // Create group in the database
            return Group.create(req.body).then(function (result) {

                // Send created group back to the client
                res.status(201).send(result);
            }).catch(function (err) {
                console.error(err)
            });
        }).done();
    });

router.route("/:id")
    /**
     * Gets a specific group from the database and stores it in res.locals.group
     */
    .all(function (req, res, next) {
        Group.findByPk(req.params.id, {
            attributes: ["id", "fullName", "displayName", "description", "email", "canOrganize", "type"],
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["displayName"]
                }
            ]
        }).then(function (group) {

            // If group does not exists, send 404
            if (group === null) {
                res.status(404).send({status: "Not Found"});
            } else {

                // Store group
                res.locals.group = group;
                next();
            }
        });
    })
    /**
     * Sends group from the database to the client
     */
    .get(function (req, res) {

        // Check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to view the group
        permissions.check(user, {type: "GROUP_VIEW", value: req.params.id}).then(function (result) {

            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Send group to client
            res.send(res.locals.group);
        }).done();
    })
    /**
     * Edits a group in the database
     */
    .put(function (req, res) {

        // Check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to manage groups
        permissions.check(user, {
            type: "GROUP_MANAGE",
            value: res.locals.group.id
        }).then(function (result) {

            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Update the database
            return res.locals.group.update(req.body[0]).then(function (group) {

                // remove all current group members
                for (var i = 0; i < group.members.length; i++) {
                    group.members[i].user_group.destroy();
                }

                // add all new group members
                req.body[1].forEach(function (new_group_member) {
                    User.findByPk(new_group_member.id).then(function (new_user) {
                        new_user.addGroups(res.locals.group, {through: {func: new_group_member.func}}).then(console.log);
                    })
                });

                // Send new group to the client
                res.send(group);
            }, function (err) {
                console.error(err);
            });
        });
    })
    /**
     * Deletes a group from the database
     */
    .delete(function (req, res) {

        // Check if client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if client has permission to manage groups
        permissions.check(user, {
            type: "GROUP_MANAGE",
            value: res.locals.group.id
        }).then(function (result) {

            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Destroy group in database
            return res.locals.group.destroy();
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });

router.route("/type/:type")
    /**
     * Gets all groups of a certain type from the database
     */
    .get(function (req, res) {
        Group.findAll({
            attributes: ["id", "fullName", "displayName", "description", "email"],
            where: {type: req.params.type},
            order: [
                ["id", "ASC"]
            ]
        }).then(function (results) {
            res.send(results);
        });
    });
module.exports = router;
