var Q = require("q");
var app = require("../expressServer");
var request = require("supertest");

var User = require("../models/user");
var Group = require("../models/group");
var Activity = require("../models/activity");

var authHelper = require("../helpers/authHelper");
var tester = require("./tester");

var testUser = {
    displayName: "Bob",
    email: "bob@hsaconfluente.nl",
    password: "ILikeTrains",
    passwordSalt: new Buffer("BlahBlah")
};
testUser.passwordHash = authHelper.getPasswordHashSync(testUser.password, testUser.passwordSalt);

function getAgent() {
    return request.agent(app).use((a) => {
        a.set("X-Requested-With", "XMLHttpRequest");
    })
}

var testUserAgent = getAgent();
var activeUserAgent = getAgent();
var adminUserAgent = getAgent();
var nobodyUserAgent = getAgent();

var membersGroup = {
    displayName: "Members",
    canOrganize: false
};

var testGroup = {
    displayName: "Organizing group",
    canOrganize: true
};

var activeUser = {
    displayName: "Alice",
    email: "alice@hsaconfluente.nl",
    password: "ILikeTrains",
    passwordSalt: new Buffer("BlahBlah")
};
activeUser.passwordHash = authHelper.getPasswordHashSync(activeUser.password, activeUser.passwordSalt);

var admin = {
    displayName: "Admin",
    email: "web@hsaconfluente.nl",
    password: "WcMqXcea56Bi2F9J",
    passwordSalt: new Buffer(""),
    isAdmin: true
};
admin.passwordHash = authHelper.getPasswordHashSync(admin.password, admin.passwordSalt);

var testActivity = {
    name: "Website testing",
    description: "User and unit testing of the website",
    published: true
};

var unpublishedActivity = {
    name: "Stealing indepencence",
    description: "Steal the declaration of independence for shits and giggles",
    published: false
};

before(function () {
    //console.log("Inserting test data");
    return Q.all([
        Group.create(testGroup).then(function (group) {
            testGroup.id = group.id;
            return group;
        }),
        Group.create(membersGroup).then(function (group) {
            membersGroup.id = group.id;
            return group;
        })
    ]).then(function (groups) {
        return Q.all([
            User.create(admin).then(function (user) {
                admin.id = user.id;
            }),
            User.create(testUser).then(function (user) {
                testUser.id = user.id;
                return user.addGroup(groups[1], {func: "member"});
            }),
            User.create(activeUser).then(function (user) {
                activeUser.id = user.id;
                return user.addGroup(groups[0], {func: "chairman"});
            })//.then(console.log)
        ]);
    })
        .then(function () {
            unpublishedActivity.OrganizerId = testGroup.id;
            testActivity.OrganizerId = testGroup.id;
            return Q.all([
                Activity.create(unpublishedActivity),
                Activity.create(testActivity)
            ]).then(function (activities) {
                unpublishedActivity.id = activities[0].id;
                testActivity.id = activities[1].id;
                //return activity.setOrganizer(testGroup.id);
            });
        }).then(function () {
            return Q.all([
                tester.authenticate(testUserAgent, testUser),
                tester.authenticate(activeUserAgent, activeUser),
                tester.authenticate(adminUserAgent, admin)
            ]);
        });//.then(function(){return Group.findAll({include: [User]})}).then(console.log);
});

after(function () {
    //console.log("Removing test data");
    return User.truncate();
});

module.exports = {
    testUser: testUser,
    activeUser: activeUser,
    admin: admin,
    testGroup: testGroup,
    membersGroup: membersGroup,
    testActivity: testActivity,
    unpublishedActivity: unpublishedActivity,
    testUserAgent: testUserAgent,
    activeUserAgent: activeUserAgent,
    adminUserAgent: adminUserAgent,
    nobodyUserAgent: nobodyUserAgent,
    getAgent: getAgent
};
