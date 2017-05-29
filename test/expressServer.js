var request = require("supertest");
var assert = require("assert");

var app = require("../expressServer");

describe("expressServer", function () {
  it("serves static files", function () {
    return request.agent(app)
    .get("/")
    .expect(200)
    .then(function () {

    });
  });

  it("serves index pages everywhere", function () {
    return request.agent(app)
    .get("/activities")
    .expect(200)
    .then(function () {

    });
  });

  it("serves 404 on api paths", function () {
    return request.agent(app)
    .get("/api/not/a/valid/endpoint")
    .expect(404);
  });

  it("redirects to 404 for non-existing pages", function () {
    return request.agent(app)
    .get("/api/page/invalid/view")
    .expect(404);
  });

  it("checks the session token", function () {
    return request.agent(app)
    .get("/")
    .set("Cookie", "session=vRN4oAXh")
    .expect('set-cookie', /session=;/);
  });
});
