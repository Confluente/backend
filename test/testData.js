var Q = require("q");
var app = require("../expressServer");
var request = require("supertest");

var User = require("../models/user");
var Group = require("../models/group");
var Activity = require("../models/activity");

var tester = require("./tester");

var testUser = {
  displayName: "Bob",
  email: "bob@hsaconfluente.nl",
  password: "ILikeTrains",
  passwordHash: Buffer.from("wxAqn6KKjPXCZWafvEDFcDmh9ZbJLU3TTzcnf9jKu3k=", "base64"),
  passwordSalt: new Buffer("BlahBlah")
};
var testUserAgent = request.agent(app);
var activeUserAgent = request.agent(app);
var adminUserAgent = request.agent(app);
var nobodyUserAgent = request.agent(app);

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
  passwordHash: Buffer.from("wxAqn6KKjPXCZWafvEDFcDmh9ZbJLU3TTzcnf9jKu3k=", "base64"),
  passwordSalt: new Buffer("BlahBlah")
};

var admin = {
  displayName: "Admin",
  email: "web@hsaconfluente.nl",
  password: "WcMqXcea56Bi2F9J",
  passwordHash: Buffer.from("2VvpYmBlBCLfPy05cMqK0P8/+gz0d0d2631eyxBMjWU=", "base64"),
  passwordSalt: new Buffer(""),
  isAdmin: true
};

var testActivity = {
  name: "Website testing",
  description: "User and unit testing of the website",
  approved: true
};

var unapprovedActivity = {
  name: "Stealing indepencence",
  description: "Steal the declaration of independence for shits and giggles",
  approved: false
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
      User.create(admin).then(function (user) {admin.id = user.id;}),
      User.create(testUser).then(function (user) {testUser.id = user.id; return user.addGroup(groups[1], {func: "member"});}),
      User.create(activeUser).then(function (user) {activeUser.id = user.id; return user.addGroup(groups[0], {func: "chairman"});})//.then(console.log)
    ]);
  })
  .then(function () {
    unapprovedActivity.OrganizerId = testGroup.id;
    testActivity.OrganizerId = testGroup.id;
    return Q.all([
      Activity.create(unapprovedActivity),
      Activity.create(testActivity)
    ]).then(function (activities) {
      unapprovedActivity.id = activities[0].id;
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
  unapprovedActivity: unapprovedActivity,
  testUserAgent: testUserAgent,
  activeUserAgent: activeUserAgent,
  adminUserAgent: adminUserAgent,
  nobodyUserAgent: nobodyUserAgent
};
