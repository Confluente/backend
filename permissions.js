var Q = require("q");

var User = require("./models/user");
var Group = require("./models/group");
var Activity = require("./models/activity");

/**
 * Checks whether user has required permissions for a given scope
 * @param user
 * @param scope
 * @returns boolean
 */
function check(user, scope) {
    var loggedIn = true;
    return Q.Promise(function (resolve, reject) {
        if (!user) {
            // User undefined
            loggedIn = false;
            resolve();
        } else if (typeof user === 'number') {
            resolve(User.findByPk(user));
        } else {
            console.log("easy going");
            resolve(user);
        }
    }).then(function (user) {
        if (loggedIn && user.dataValues.isAdmin && scope.type !== "CHANGE_PASSWORD") {
            // Admin has all permissions
            return true;
        }
        switch (scope.type) {
            case "PAGE_VIEW":
                // Everyone allowed to view pages
                return true;
            case "PAGE_MANAGE":
                // Only admins allowed to manage pages
                return false;
            case "ACTIVITY_VIEW":
                return Activity.findByPk(scope.value).then(function (activity) {
                    if (!activity) {
                        return false;
                    }
                    if (activity.published) {
                        // published activities allowed to be viewed by anyone
                        return true;
                    }
                    // Unpublished activities only allowed to be viewed by organizers and admins
                    return loggedIn ? user.hasGroup(activity.OrganizerId) : false;
                });
            case "ACTIVITY_EDIT":
                return Activity.findByPk(scope.value).then(function (activity) {
                    // Activities only allowed to be edited by organizers and admins
                    return loggedIn ? user.hasGroup(activity.OrganizerId) : false;
                });
            case "GROUP_ORGANIZE":
                if (!loggedIn) return false;
                return Group.findByPk(scope.value).then(function (group) {
                    // Check whether group is allowed to organize
                    if (!group.canOrganize) return false;
                    // If the group is allowed to organize, return whether user is member of the group
                    return user.hasGroup(group.id);
                });
            case "USER_VIEW":
                return User.findByPk(scope.value).then(function (user_considered) {
                    if (!user_considered) {
                        return false;
                    }
                    // Non-admin users can only view their own account
                    return user.id === user_considered.id;
                });
            case "CHANGE_PASSWORD":
                return User.findByPk(scope.value).then(function (user_considered) {
                    if (!user_considered) {
                        return false;
                    }
                    // Everyone can only change their own password
                    return user.id === user_considered.id;
                });
            case "USER_MANAGE":
                // Only admins allowed to manage users
                return false;
            case "CREATE_USER":
                // Everyone is allowed to submit a request for an account
                return true;
            case "GROUP_MANAGE":
                // Only admins are allowed to manage groups
                return false;
            case "GROUP_VIEW":
                // Everyone is allowed to see groups
                return true;
            case "COMPANY_OPPORTUNITY_VIEW":
                // Everyone is allowed to see any company opportunity
                return true;
            case "COMPANY_OPPORTUNITY_MANAGE":
                // Only members of the acquisition committee are allowed to manage company opportunities
                return Group.findAll({
                    where: {
                        email: 'acquisition@hsaconfluente.nl'
                    }
                }).then(function (group) {
                    for (var i = 0; i < group.members.length; i++) {
                        if (group.members[i].id === user.id) {
                            return true;
                        }
                    }

                    return false;
                })
            default:
                throw new Error("Unknown scope type");
        }
    });
}

function all(promises) {
    return Q.all(promises).then(function (results) {
        return results.every(function (e) {
            return e;
        });
    });
}


function requireAll(scopes) {
    if (!scopes.length) {
        scopes = [scopes];
    }
    return function (req, res, next) {
        var user = res.locals.session ? res.locals.session.user : null;
        var promises = scopes.map(function (scope) {
            return check(user, scope);
        });
        all(promises).then(function (result) {
            if (!result) {
                return res.sendStatus(403);
            }
            return next();
        }).fail(function (err) {
            next(err);
        }).done();
    };
}

module.exports = {
    all: all,
    check: check,
    requireAll: requireAll
};
