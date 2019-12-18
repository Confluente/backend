var assert = require("assert");

var testData = require("../testData");

describe("routes/group", function () {

    var testGroup = {
        displayName: "memeCommittee",
        fullName: "The Absolute Best meme committee",
        description: "Makes memes",
        email: "lololol@hsaconfluente.nl",
        canOrganize: false
    };

    var groupId;

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

    describe("POST /group", function() {
        it("creates a group", function() {
            return testData.adminUserAgent
                .post("/api/group")
                .send(testGroup)
                .expect(201)
                .then(function (res) {
                    const group = res.body;
                    groupId = group.id;
                    assert(typeof group.displayName === "string");
                    assert(typeof group.description === "string");
                    assert(typeof group.fullName === "string");
                    assert(typeof group.email === "string");
                    assert(typeof group.canOrganize === "boolean");
                    assert(!res.canOrganize);
                });
        });

        it("requires permission", function() {
            return testData.testUserAgent
                .post("/api/group")
                .send(testGroup)
                .expect(403);
        });
    });

    // In order to run this test succesfully,
    // the POST test has to be run in advance in the same session
    describe("GET /group/:id", function() {
        it("returns a group", function() {
            return testData.adminUserAgent
                .get("/api/group/" + groupId)
                .expect(200)
                .then(function (res) {
                    var group = res.body;
                    assert(typeof group.displayName === "string");
                    assert(typeof group.description === "string");
                    assert(typeof group.fullName === "string");
                    assert(typeof group.email === "string");
                    assert(typeof group.canOrganize === "boolean");
                });
        });

        it("requires no permission", function() {
            return testData.testUserAgent
                .get("/api/group/" + groupId)
                .expect(200);
        });
    });

    describe("PUT /group/:id", function() {
        const groupEdit = {
            displayName: "mem committee"
        };

        it("edits a group", function() {
            return testData.adminUserAgent
                .put("/api/group/" + groupId)
                .send(groupEdit)
                .expect(200)
                .then(function (res) {
                    var group = res.body;
                    assert(group.displayName === "mem committee");
                })
        });

        it("requires permission", function() {
            return testData.testUserAgent
                .put("/api/group/" + groupId)
                .send(groupEdit)
                .expect(403);
        });
    });

    describe("DELETE /group/:id", function() {
        it("requires permission", function() {
            return testData.testUserAgent
                .delete("/api/group/" + groupId)
                .expect(403);
        });

        it("deletes a group", function() {
            return testData.adminUserAgent
                .delete("/api/group/" + groupId)
                .expect(204)
                .then(function (res) {
                    return testData.nobodyUserAgent
                        .get("/api/group/" + groupId)
                        .expect(404);
                });
        });

        it("handles non-existing groups", function() {
            return testData.adminUserAgent
                .delete("/api/group/1984")
                .expect(404);
        })
    });
});
