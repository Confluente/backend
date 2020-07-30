var assert = require("assert");

var testData = require("../testData");
var authHelper = require("../../helpers/authHelper");

describe("authHelper", function () {

    describe("#authenticate", function () {

        function testAuthenticate(email, password, expected) {
            return authHelper.authenticate(email, password).then(function (result) {
                if (expected === undefined) {
                    assert(!!result);
                    assert.equal(result.email, email.toLowerCase());
                } else {
                    assert.equal(result, expected);
                }
            });
        }

        it("returns user object when authentication is ok", function () {
            return testAuthenticate(testData.testUser.email, testData.testUser.password);
        });

        it("doesn't require email to be case sensitive", function () {
            return testAuthenticate(testData.testUser.email.toUpperCase(), testData.testUser.password);
        });

        it("requires password to be case sensitive", function () {
            return testAuthenticate(testData.testUser.email, testData.testUser.password.toUpperCase(), null);
        });

        it("returns null if user doesn't exist", function () {
            return testAuthenticate("nonexistant", "Foo", null);
        });

        it("returns null if the password is wrong", function () {
            return testAuthenticate(testData.testUser.email, "NotThePassword", null);
        });

    });

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
