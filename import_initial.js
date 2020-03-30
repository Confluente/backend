var Q = require("q");

var User = require("./models/user");
var Group = require("./models/group");
var Activity = require("./models/activity");

// Initial accounts
var users = [
    {
        id: 1,
        email: "admin",
        displayName: "Administrator",
        passwordHash: Buffer.from("tfExQFTNNT/gMWGfe5Z8CGz2bvBjoAoE7Mz7pmWd6/g=", "base64"),
        passwordSalt: Buffer.from("LAFU0L7mQ0FhEmPybJfHDiF11OAyBFjEIj8/oBzVZrM=", "base64"),
        isAdmin: true,
        approved: true,
        groups: [2],
        functions: ["Member"]
    },
    {
        id: 2,
        email: "activemember1@student.tue.nl",
        displayName: "Active1 Member",
        passwordHash: Buffer.from("tfExQFTNNT/gMWGfe5Z8CGz2bvBjoAoE7Mz7pmWd6/g=", "base64"),
        passwordSalt: Buffer.from("LAFU0L7mQ0FhEmPybJfHDiF11OAyBFjEIj8/oBzVZrM=", "base64"),
        isAdmin: false,
        approved: true,
        groups: [3, 4],
        functions: ["Chair, Secretary"]
    },
    {
        id: 3,
        email: "activemember2@student.tue.nl",
        displayName: "Active2 Member",
        passwordHash: Buffer.from("tfExQFTNNT/gMWGfe5Z8CGz2bvBjoAoE7Mz7pmWd6/g=", "base64"),
        passwordSalt: Buffer.from("LAFU0L7mQ0FhEmPybJfHDiF11OAyBFjEIj8/oBzVZrM=", "base64"),
        isAdmin: false,
        approved: true,
        groups: [3],
        functions: ["Member"]
    },
    {
        id: 4,
        email: "activemember3@student.tue.nl",
        displayName: "Active3 Member",
        passwordHash: Buffer.from("tfExQFTNNT/gMWGfe5Z8CGz2bvBjoAoE7Mz7pmWd6/g=", "base64"),
        passwordSalt: Buffer.from("LAFU0L7mQ0FhEmPybJfHDiF11OAyBFjEIj8/oBzVZrM=", "base64"),
        isAdmin: false,
        approved: true,
        groups: [4],
        functions: ["Treasurer"]
    }
];

// Initial groups
var groups = [
    {
        id: 2,
        displayName: "Confluente",
        fullName: "H.S.A. Confluente",
        canOrganize: true,
        email: "board@hsaconfluente.nl",
        type: "Board"
    },
    {
        id: 3,
        displayName: "First Committee",
        fullName: "The first f***in' committee!!",
        description: "Can you believe it! It is the first awesome committee",
        canOrganize: true,
        email: "firstcommittee@hsaconfluente.nl",
        type: "Committee"
    },
    {
        id: 4,
        displayName: "Second Committee",
        fullName: "The second f***in' committee!!",
        description: "Can you believe it! It is the second awesome committee",
        canOrganize: true,
        email: "secondcommittee@hsaconfluente.nl",
        type: "Committee"
    }
];

// initial activities
var activities = [
    {
        id: 1,
        name: "The first ever activity!",
        description: "Wuuuuut its an activity!",
        location: "SOMEEEEWHERE OVER THE RAINBOW",
        date: new Date(),
        startTime: "18:00",
        endTime: "20:00",
        participationFee: 8.5
    },
    {
        id: 2,
        name: "The first activity that you can subscribe to!",
        descrtion: "Subscription forms!! How advanced!!",
        location: "Completely in the dark",
        date: (new Date()).setDate((new Date()).getDate() + 1),
        startTime: "01:00",
        endTime: "05:00",
        canSubscribe: true,
        numberOfQuestions: 4,
        typeOfQuestions: "name#,#TU/e email#,#☰ text#,#◉ multiple choice",
        questionDescriptions: "Name#,#TU/e email#,#What kind of dog breed do you like?#,#What sound does a dog make?",
        formOptions: "#,##,##,#Woof#;#Woofdiedoofdoof#;#Wafferdafdaf",
        required: "true#,#true#,#true#,#false",
        subscriptionDeadline: (new Date()).setDate((new Date()).getDate() + 1),
        approved: true
    }
];



// Import initial administrator and initial group to database
Q.all([
    User.bulkCreate(users).then(function (result) {
        console.log("Created users");
    }),
    Group.bulkCreate(groups).then(function (result) {
        console.log("Created groups");
    }),
    Activity.bulkCreate(activities).then(function (result) {
        console.log("Created activities")
    })
]).then(function () {
    var promises = [];

    users.forEach(function (userData) {
        var promise = User.findByPk(userData.id).then(function (user) {
            if (!userData.functions || !userData.groups) {
            } else if (userData.functions.length !== userData.groups.length) {
                assert(false);
            } else {
                for (var i = 0; i < userData.functions.length; i++) {
                    user.addGroup(userData.groups[i], {through: {func: userData.functions[i]}})
                }
            }

        });
    });

    return Q.all(promises);
}).then(function () {
    console.log("Done!");
}).done();
