var assert = require("assert");

var testData = require("../testData");

describe("routes/group", function () {

    describe("GET /group", function () {
        it("lists all groups", function () {
            return testData.adminUserAgent
                .get("/api/group")
                .expect(200)
                .then(function (res) {
                    //console.log(res.body);
                });
        });

        it("requires permission", function () {
            return testData.testUserAgent
                .get("/api/group")
                .expect(403);
        });
    });

});
