var assert = require("assert");
var Activity = require("../../models/activity");

describe("models/activity", function () {

    var testActivity = {
        name: "Coding class",
        description: "Learn to become a haxxor"
    };

    it("can insert a new activity", function () {
        return Activity.create(testActivity);
    });

    it("can list all activities", function () {
        return Activity.findAll().then(function (activities) {
            assert(activities.length >= 1);
            assert(typeof activities[0].canSubscribe === "boolean");
        });
    });

});
