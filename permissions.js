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
        // return user.role.permissions[scope];

        switch (scope.type) {
            case "PAGE_VIEW":
                return user.role.permissions[scope.type];
            case "PAGE_MANAGE":
                return user.role.permissions[scope.type];
            case "USER_CREATE":
                return user.role.permissions[scope.type]
            case "USER_VIEW":
                return User.findByPk(scope.value).then(function (user_considered) {
                    if (!user_considered) {
                        return false;
                    }
                    // Users can view their own account
                    let ownAccount = (user.id === user_considered.id);
                    return ownAccount || user.role.permissions["USER_VIEW_ALL"]
                });
            case "USER_MANAGE":
                return user.role.permissions[scope.type]
            case "CHANGE_PASSWORD":
                return User.findByPk(scope.value).then(function (user_considered) {
                    if (!user_considered) {
                        return false;
                    }
                    // Users can change their own password
                    let ownAccount = (user.id === user_considered.id);
                    return ownAccount || user.role.permissions["CHANGE_ALL_PASSWORDS"]
                });
            case "GROUP_VIEW":
                return user.role.permissions[scope.type]
            case "GROUP_MANAGE":
                return user.role.permissions[scope.type]
            case "GROUP_ORGANIZE":
                if (!loggedIn) return false;
                return Group.findByPk(scope.value).then(function (group) {
                    // Check whether group is allowed to organize
                    if (!group.canOrganize) return false;
                    // If the group is allowed to organize, members are allowed to organize
                    let member = user.hasGroup(group.id);
                    return member || user.role.permissions["GROUP_ORGANIZE_WITH_ALL"]
                });
            case "ACTIVITY_VIEW":
                return Activity.findByPk(scope.value).then(function (activity) {
                    if (!activity) {
                        return false;
                    }
                    if (activity.published) {
                        return user.role.permissions["ACTIVITY_VIEW_PUBLISHED"]
                    }
                    // Unpublished activities allowed to be seen by organizers
                    let organizing = loggedIn ? user.hasGroup(activity.OrganizerId) : false;
                    return organizing || user.role.permissions["ACTIVITY_VIEW_ALL_UNPUBLISHED"];
                });
            case "ACTIVITY_EDIT":
                return Activity.findByPk(scope.value).then(function (activity) {
                    // Activities allowed to be edited by organizers
                    let organizing = loggedIn ? user.hasGroup(activity.OrganizerId) : false;
                    return organizing || user.role.permissions["ACTIVITY_MANAGE"]
                });
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
