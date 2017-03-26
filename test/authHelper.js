var assert = require("assert");

var authHelper = require("../authHelper");

describe("authHelper", function () {

  describe("#startSession", function () {

    it("returns a session", function () {
      return authHelper.startSession(1, "localhost")
      .then(function (session) {
        assert(session.token.length > 10);
        assert(session.expires > new Date());
      });
    });

  });

});
