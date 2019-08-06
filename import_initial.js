var Q = require("q");

var User = require("./models/user");
var Group = require("./models/group");

// Initial administrator account
var users = [
  {
    id: 1,
    email: "admin",
    displayName: "Administrator",
    passwordHash: Buffer.from("tfExQFTNNT/gMWGfe5Z8CGz2bvBjoAoE7Mz7pmWd6/g=", "base64"),
    passwordSalt: Buffer.from("LAFU0L7mQ0FhEmPybJfHDiF11OAyBFjEIj8/oBzVZrM=", "base64"),
    isAdmin: true,
    groups: [2]
  }
];

// Initial group (board)
var groups = [
  {
    id: 2,
    displayName: "Confluente",
    fullName: "H.S.A. Confluente",
    canOrganize: true,
    email: "board@hsaconfluente.nl"
  }
];

// Import initial administrator and initial group to database
Q.all([
  User.bulkCreate(users).then(function (result) {
    console.log("Created user(s)");
  }),
  Group.bulkCreate(groups).then(function (result) {
    console.log("Created group(s)");
  })
]).then(function () {
  var promises = [];

  users.forEach(function (userData) {
    var promise = User.findById(userData.id).then(function (user) {
      console.log("Adding groups " + JSON.toString(groups) + " to " + userData.id);
      return user.addGroups(userData.groups).then(console.log);
    });
  });

  return Q.all(promises);
}).then(function () {
  console.log("Done!");
}).done();
