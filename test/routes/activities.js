var assert = require("assert");

var testData = require("../testData");

describe("routes/activities", function () {

    before(function () {
        testActivity.organizer = testData.testGroup.id;
        //return require("../../models/activity").truncate();
    });

    var testActivity = {
        name: "foo",
        description: "bar",
        published: true,
        location: "honors room",
        date: new Date(),
        startTime: "18:00",
        endTime: "20:00",
        participationFee: "7",
        canSubscribe: true,
        numberOfQuestions: 3,
        titlesOfQuestions: ["text", "checkbox", "radio"],
        typeOfQuestion: ["text", "checkbox", "radio"],
        questionDescriptions: ["What are you thinking about?", "What vegetables do you like?", "Is this required?"],
        options: ["", "car;bike", "maybe;sort of"],
        required: ["yes", "no", "no"]
    };

    var activityId;

    describe("POST /activities", function () {

        it("creates a new activity", function () {
            return testData.activeUserAgent
                .post("/api/activities")
                .send(testActivity)
                .expect(201)
                .then(function (res) {
                    //console.log(res.body);
                    activityId = res.body.id;
                    assert(res.body.name === testActivity.name);
                    assert(res.body.numberOfQuestions === 5);
                    assert(typeof res.body.questionDescriptions === "string");
                    assert(typeof res.body.formOptions === "string")
                });
        });

        it("requires an organizing group", function () {
            return testData.testUserAgent
                .post("/api/activities")
                .send(testActivity)
                .expect(403);
        });

    });

    describe("GET /activities", function () {

        it("lists all activities", function () {
            return testData.nobodyUserAgent
                .get("/api/activities")
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (res) {
                    assert(res.body.length > 0);
                    res.body.forEach(function (activity) {
                        //console.log(activity);
                        assert(typeof activity.name === "string");
                        assert(typeof activity.description === "string");
                        assert(typeof activity.description_html === "string");
                        assert(activity.description_html.includes("<p>"));
                        assert.equal(typeof activity.Organizer, "object");
                        // assert(typeof activity.canSubscribe === "boolean");
                        assert(activity.published);
                    });
                });
        });

    });

    describe("GET /activities/manage", function () {
        it("lists all activities in manage", function () {
            return testData.adminUserAgent
                .get("/api/activities/manage")
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (res) {
                    assert(res.body.length > 0);
                    res.body.forEach(function (activity) {
                        //console.log(activity);
                        assert(typeof activity.name === "string");
                        assert(typeof activity.description === "string");
                        assert(typeof activity.description_html === "string");
                        assert(activity.description_html.includes("<p>"));
                        assert.equal(typeof activity.Organizer, "object");
                        // assert(typeof activity.canSubscribe === "boolean");
                        assert(activity.published);
                    });
                });
        });

        it("requires permission", function () {
            return testData.getAgent()
                .get("/api/activities/manage")
                .expect(403);
        });
    });

    describe("POST /activities/subscriptions/:id", function () {

        var answers = ["myName", "myEmail", "testCases", "car;bike", "maybe"];

        it("adds a subscription", function() {
            return testData.activeUserAgent
                .post("/api/activities/subscriptions/" + activityId)
                .send(answers)
                .then(function (res) {
                    console.log(res.body);
                    assert(typeof res.body[0].answers === "string");
                    assert(res.body[0].userId === testData.activeUser.id);
                    assert(res.body[0].activityId === activityId);
                })
        })
    });

    describe("GET /activities/:id", function () {

        it("returns an activity", function () {
            return testData.nobodyUserAgent
                .get("/api/activities/" + activityId)
                .expect(200)
                .then(function (res) {
                    var activity = res.body;
                    assert(typeof activity.description === "string");
                    assert(typeof activity.description_html === "string")
                    assert(activity.description_html.includes("<p>"));
                    assert.equal(typeof activity.Organizer, "object");
                });
        });

        it("handles non-existing activities", function () {
            return testData.nobodyUserAgent
                .get("/api/activities/1984")
                .expect(404);
        });

    });

    describe("PUT /activities/:id", function () {

        var changedActivity = {
            name: "Baz"
        };

        it("changes an activity", function () {
            return testData.activeUserAgent
                .put("/api/activities/" + testData.unpublishedActivity.id)
                .send(changedActivity)
                .expect(200)
                .then(function (res) {
                    assert(res.body.name === changedActivity.name);
                    assert(res.body.description === testData.unpublishedActivity.description);
                    return testData.activeUserAgent
                        .get("/api/activities/" + testData.unpublishedActivity.id)
                        .expect(200)
                        .then(function (res) {
                            assert(res.body.name === changedActivity.name);
                            assert(res.body.description === testData.unpublishedActivity.description);
                        });
                });
        });

        it("handles non-existing activities", function () {
            return testData.nobodyUserAgent
                .put("/api/activities/1984")
                .expect(404);
        });

        it("requires permission", function () {
            return testData.nobodyUserAgent
                .put("/api/activities/" + testData.unpublishedActivity.id)
                .send({description: "Jet fuel can't melt steel beams"})
                .expect(403);
        });

    });

    describe("DELETE /activities/:id", function () {

        it("deletes an activity", function () {
            return testData.activeUserAgent
                .delete("/api/activities/" + activityId)
                .expect(204)
                .then(function (res) {
                    return testData.nobodyUserAgent
                        .get("/api/activities/" + activityId)
                        .expect(404);
                });
        });

        it("handles non-existing activities", function () {
            return testData.activeUserAgent
                .delete("/api/activities/1984")
                .expect(404);
        });

        it("requires permission", function () {
            return testData.nobodyUserAgent
                .delete("/api/activities/" + testData.testActivity.id)
                .expect(403);
        });

    });

});
