var request = require("supertest");
var assert = require("assert");

var testData = require("../testData");
var authenticate = require("../tester").authenticate;
var app = require("../../expressServer");

describe("routes/user", function () {

  before(function () {
    //return User.truncate();
  });

  var agent = request.agent(app);

  afterEach(function () {
    agent = request.agent(app);
  });


  describe("POST /user/login", function () {
    it("starts a session", function () {
      return agent
      .post("/api/user/login")
      .send({email: testData.testUser.email, password: testData.testUser.password})
      .expect(200)
      //.expect('set-cookie', 'cookie=hey; Path=/', done);
      .then(function (res) {
        var cookie = res.headers['set-cookie'][0].split(';');
        assert(cookie.length === 2);
        assert(cookie[0].split("=")[0] === "session");
        assert(typeof cookie[0].split("=")[1] === "string");
      });
    });

    it("fails when the password is wrong", function () {
      return agent
      .post("/api/user/login")
      .send({email: testData.testUser.email, password: "NotTHePassword"})
      .expect(401);
    });

  });

  describe("GET /user", function () {
    it("gets the user details ", function () {
      return testData.testUserAgent
      .get("/api/user")
      .expect(200)
      .then(function (res) {
        assert(!res.body.canOrganize);
        //console.log(res.body);
      });
    });
    it("has #groups and #canOrganize accordingly", function () {
      return testData.activeUserAgent
      .get("/api/user")
      .expect(200)
      .then(function (res) {
        //console.log(res.body);
        assert(res.body.groups);
        assert(res.body.canOrganize);
      });
    });
  });

});
