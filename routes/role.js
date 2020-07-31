var express = require("express");
var Role = require("../models/role");
var permissions = require("../permissions");
var dictionaryHelper = require("../helpers/dictionaryHelper")

var router = express.Router();

router.route("/")
    /**
     * Gets all roles from the database
     */
    .get(function (req, res, next) {
        // Check if the client is logged in
        var user = res.locals.session ? res.locals.session.user : null;

        // Check if the client has permission to manage roles
        permissions.check(user, {
            type: "ROLE_MANAGE",
            value: user
        }).then(function (result) {
            // If no result, then the client has no permission
            if (!result) res.sendStatus(403);

            // If client has permission, find all roles in database
            Role.findAll({
                attributes: ["name", "permissions"],
                order: [
                    ["id", "ASC"]
                ]
            }).then(function (results) {
                // Modify the results to correctly format the permissions for the frontend
                let roles = results.map(function (role) {
                    role.permissions = dictionaryHelper.destringifyStringifiedDictionaryOfBooleans(role.permissions);
                    return role;
                })

                // Send the roles back to the client
                res.send(roles);
            });
        }).done();
    })

    /**
     * Creates a new role in the database
     */
    .post(function (req, res, next) {
        // Check if required fields are filled in
        if (!req.body.name || !req.body.permissions) {
            return res.sendStatus(400);
        }

        // Create new role in database
        return Role.create(req.body).then(function (result) {
            res.status(201).send(result);
        }).catch(function (err) {
            res.status(406).send("Role with identical name already exists");
        }).done();
    });

// Specific role route
router.route("/:id")
    /**
     * Get a specific role from the database and return to the client
     */
    .get(function (req, res) {
        // Check if client has a session
        var user = res.locals.session ? res.locals.session.user : null;

        // If client does not have a session, he does not have permission
        if (user === null) return res.send(403);

        permissions.check(user, {
            type: "ROLE_MANAGE",
            value: user
        }).then(function (result) {
            // If no result, then the client has no permission
            if (!result) res.sendStatus(403);

            // If client has permission, get the role from the database
            Role.findByPk(req.params.id, {
                attributes: ["name", "permissions"],
            }).then(function (role) {
                // Return if role not found
                if (role === null) {
                    res.status(404).send({status: "Not Found"});
                } else {
                    // Format the permissions correctly for the frontend
                    role.permissions = dictionaryHelper.destringifyStringifiedDictionaryOfBooleans(role.permissions);

                    // Return the role
                    res.send(role);
                }
            });
        }).done();
    })

    /**
     * Edit a role
     */
    .put(function (req, res) {
        // Check if client has a session
        var user = res.locals.session ? res.locals.session.user : null;

        // If client does not have a session, he does not have permission
        if (user === null) return res.send(403);

        // Check whether the client has permission to manage (edit) roles
        permissions.check(user, {
            type: "ROLE_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            // If no permission, send 403
            if (!result) {
                return res.sendStatus(403);
            }

            // Find the role
            Role.findByPk(req.params.id, {
                attributes: ["name", "permissions"],
            }).then(function (role) {
                // Return if role not found
                if (role === null) {
                    res.status(404).send({status: "Not Found"});
                } else {
                    req.body.permissions = dictionaryHelper.stringifyDictionaryOfBooleans(req.body.permissions);

                    return role.update(req.body).then(function (updatedRole) {
                        res.send(updatedRole);
                    }, function (err) {
                        console.log(err);
                    });
                }
            }).done();
        });
    })

    /**
     * Delete role from the database
     */
    .delete(function (req, res) {
        // Check if client has a session
        var user = res.locals.session ? res.locals.session.user : null;

        // If client does not have a session, he does not have permission
        if (user === null) return res.send(403);

        // Check if client has the permission to manage (delete) roles
        permissions.check(user, {
            type: "ROLE_MANAGE",
            value: res.locals.user.id
        }).then(function (result) {
            // If no permission, send 403
            if (!result) return res.sendStatus(403)

            // Find the role
            Role.findByPk(req.params.id, {
                attributes: ["name", "permissions"],
            }).then(function (role) {
                // Return if role not found
                if (role === null) {
                    res.status(404).send({status: "Not Found"});
                } else {
                    // Destory role in database
                    role.destroy();
                }
            });
        }).then(function () {
            res.status(204).send({status: "Successful"});
        });
    });


module.exports = router;
