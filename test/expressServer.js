var request = require("supertest");
var assert = require("assert");

var app = require("../expressServer");
var testData = require("./testData");

describe("expressServer", function () {
    beforeEach(function () {
        agent = testData.getAgent();
    });

    it("serves static files", function () {
        return agent
            .get("/")
            .expect(200)
            .then(function () {

            });
    });

    it("serves index pages everywhere", function () {
        return agent
            .get("/activities")
            .expect(200)
            .then(function () {

            });
    });

    it("serves 404 on api paths", function () {
        return agent
            .get("/api/not/a/valid/endpoint")
            .expect(404);
    });

    it("redirects to 404 for non-existing pages", function () {
        return agent
            .get("/api/page/invalid/view")
            .expect(404);
    });

    it("checks the session token", function () {
        return agent
            .get("/")
            .set("Cookie", "session=vRN4oAXh")
            .expect('set-cookie', /session=;/);
    });

    it("enforces AJAX request headers on /api", function () {
        return request.agent(app)
            .get("/api/activities")
            .expect(403);
    })
});
