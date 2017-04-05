var Q = require("q");

var User = require("./models/user");
var Group = require("./models/group");
var Activity = require("./models/activity");


function check(user, scope) {
  var loggedIn = true;
  return Q.Promise(function (resolve, reject) {
    if (!user) {
      loggedIn = false;
      resolve();
    } else if (typeof user === 'number') {
      resolve(User.findById(user));
    } else {
      console.log("easy going");
      resolve(user);
    }
  }).then(function (user) {
    //console.log(user);
    if (loggedIn && user.dataValues.isAdmin) {
      return true;
    }
    switch (scope.type) {
      case "PAGE_VIEW":
        return true;
      case "PAGE_MANAGE":
        return false;
      case "ACTIVITY_VIEW":
        return Activity.findById(scope.value).then(function (activity) {
          if (!activity) {return false;}
          if (activity.approved) {
            return true;
          }
          return loggedIn ? user.hasGroup(activity.OrganizerId) : false;
        });
      case "ACTIVITY_EDIT":
        return Activity.findById(scope.value).then(function (activity) {
          return loggedIn ? user.hasGroup(activity.OrganizerId) : false;
        });
      case "GROUP_ORGANIZE":
        if (!loggedIn) return false;
        return Group.findById(scope.value).then(function (group) {
          if (!group.canOrganize) return false;
          return user.hasGroup(group.id);
        });
      case "USER_MANAGE":
        return false;
      default:
        throw new Error("Unknown scope type");
    }
  });
}

function all(promises) {
  return Q.all(promises).then(function (results) {
    return results.every(function (e) {return e;});
  });
}


function requireAll(scopes) {
  if (!scopes.length) {scopes = [scopes];}
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
