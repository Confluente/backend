var assert = require("assert");

var testData = require("../testData");

describe("routes/user", function () {

    describe("GET /user", function () {
        it("lists all users", function () {
            return testData.adminUserAgent
                .get("/api/user/")
                .expect(200)
                .then(function (res) {
                    //console.log(res.body);
                });
        });

        it("requires permission", function () {
            return testData.testUserAgent
                .get("/api/user")
                .expect(403);
        });
    });

});
