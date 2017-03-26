var request = require("supertest");
var assert = require("assert");

var testData = require("../testData");
var authenticate = require("../tester").authenticate;

var app = require("../../expressServer");

describe("routes/activities", function () {

  before(function () {
    testActivity.organizer = testData.testGroup.id;
    //return require("../../models/activity").truncate();
  });

  var testActivity = {
    name: "foo",
    description: "bar",
    approved: true,
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
      return request(app)
      .get("/api/activities")
      .expect('Content-Type', /json/)
      .expect(200)
      .then(function (res) {
        assert(res.body.length > 0);
        res.body.forEach(function (activity) {
          //console.log(activity);
          assert(typeof activity.name === "string");
          assert(typeof activity.description === "string");
          assert(typeof activity.canSubscribe === "boolean");
          assert(activity.approved);
        });
      });
    });

  });

  describe("GET /activities/:id", function () {

    it("returns an activity", function () {
      return request(app)
      .get("/api/activities/" + activityId)
      .expect(200)
      .then(function (res) {
        //console.log(res.body);
      });
    });

    it("handles non-existing activities", function () {
      return request(app)
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
      .put("/api/activities/" + testData.unapprovedActivity.id)
      .send(changedActivity)
      .expect(200)
      .then(function (res) {
        assert(res.body.name === changedActivity.name);
        assert(res.body.description === testData.unapprovedActivity.description);
        return testData.activeUserAgent
        .get("/api/activities/" + testData.unapprovedActivity.id)
        .expect(200)
        .then(function (res) {
          assert(res.body.name === changedActivity.name);
          assert(res.body.description === testData.unapprovedActivity.description);
        });
      });
    });

    it("handles non-existing activities", function () {
      return request(app)
      .put("/api/activities/1984")
      .expect(404);
    });

    it("requires permission", function () {
      return testData.nobodyUserAgent
      .put("/api/activities/" + testData.unapprovedActivity.id)
      .send({description: "Jet fuel can't melt steel beams"})
      .expect(403);
    });

  });

  describe("DELETE /activities/:id", function () {

    it("deletes an activity", function () {
      return request(app)
      .delete("/api/activities/" + activityId)
      .expect(204)
      .then(function (res) {
        return request(app)
        .get("/api/activities/" + activityId)
        .expect(404);
      });
    });

    it("handles non-existing activities", function () {
      return request(app)
      .delete("/api/activities/1984")
      .expect(404);
    });

  });

});
