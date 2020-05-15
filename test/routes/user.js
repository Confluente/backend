var assert = require("assert");

var testData = require("../testData");

describe("routes/user", function () {

    const testUser = {
        displayName: "check",
        email: "security@hsaconfluente.nl",
        password: "password",
        isAdmin: false
    };

    let userId;

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

    describe("POST ./user", function() {
        it("creates a user", function() {
            return testData.adminUserAgent
                .post("/api/user/")
                .send(testUser)
                .expect(201)
                .then(function (res) {
                    const user = res.body;
                    userId = user.id;
                    assert(typeof user.displayName === "string");
                    assert(typeof user.email === "string");
                    assert(typeof user.passwordSalt === "string");
                    assert(typeof user.passwordHash === "object");
                    assert(typeof user.isAdmin === "boolean");
                });
        });

        it("requires displayName", function() {
            const testUser1 = {
                email: "security@hsaconfluente.nl",
                password: "password",
                isAdmin: false
            };

            return testData.adminUserAgent
                .post("/api/user/")
                .send(testUser1)
                .expect(400);
        });

        it("requires email", function() {
            const testUser2 = {
                displayName: "check",
                password: "password",
                isAdmin: false
            };

            return testData.adminUserAgent
                .post("/api/user/")
                .send(testUser2)
                .expect(400);
        });

        it("requires password", function() {
            var testUser3 = {
                displayName: "check",
                email: "security@hsaconfluente.nl",
                isAdmin: false
            };

            return testData.adminUserAgent
                .post("/api/user/")
                .send(testUser3)
                .expect(400);
        });
    });

    describe("GET ./user/:id", function() {
        it("gets a specific user", function() {
            return testData.adminUserAgent
                .get("/api/user/" + userId)
                .expect(200)
                .then(function(res) {
                    console.log(res.body);
                    let user = res.body[0];
                    assert(user.id === userId);
                    console.log(testUser.displayName);
                    console.log(user.displayName);
                    assert(testUser.displayName === user.displayName);
                    assert(testUser.email === user.email);
                    assert(testUser.isAdmin === user.isAdmin);
                });
        });

        it("requires permission", function() {
            return testData.testUserAgent
                .get("/api/user/" + userId)
                .expect(403);
        });
    });

    describe("PUT ./user/:id", function() {
        let userEdit = {
            displayName: "checked"
        };

        it("edits a specific user", function() {
            return testData.adminUserAgent
                .put("/api/user/" + userId)
                .send([userEdit, []])
                .expect(200)
                .then(function (res) {
                    let user = res.body;
                    assert(user.displayName === userEdit.displayName);
                });
        });

        it("requires permission", function() {
            return testData.testUserAgent
                .put("/api/user/" + userId)
                .send([userEdit, []])
                .expect(403);
        });
    });

    describe("DELETE ./user/:id", function() {
        it("requires permission", function() {
            return testData.testUserAgent
                .delete("/api/user/" + userId)
                .expect(403);
        });

        it("deletes a specific user", function() {
            return testData.adminUserAgent
                .delete("/api/user/" + userId)
                .expect(204)
                .then(function (res) {
                    return testData.adminUserAgent
                        .get("/api/user/" + userId)
                        .expect(404);
                });
        });

        it("handles non existing users", function() {
            return testData.adminUserAgent
                .delete("/api/user/" + userId)
                .expect(404);
        })
    });

    describe("PUT ./user/changePassword/:id", function() {
        let passwordChangeUnsuccessfull1 = {
            password: "IDontLikeTrains",
            passwordNew: "newPassword",
            passwordNew2: "newPassword"
        };

        let passwordChangeUnsuccessfull2 = {
            password: "ILikeTrains",
            passwordNew: "Password",
            passwordNew2: "newPassword"
        };

        let passwordChangeSuccess = {
            password: "ILikeTrains",
            passwordNew: "newPassword",
            passwordNew2: "newPassword"
        };

        it("requires permission", function() {
            return testData.adminUserAgent
                .put("/api/user/changePassword/" + userId)
                .send(passwordChangeSuccess)
                .expect(403);
        });

        it("unsuccesful change 1", function() {
            return testData.testUserAgent
                .put("/api/user/changePassword/" + testData.testUser.id)
                .send(passwordChangeUnsuccessfull1)
                .expect(406);
        });

        it("unsuccesful change 2", function() {
            return testData.testUserAgent
                .put("/api/user/changePassword/" + testData.testUser.id)
                .send(passwordChangeUnsuccessfull2)
                .expect(406);
        });

        it("succesful change", function() {
            return testData.testUserAgent
                .put("/api/user/changePassword/" + testData.testUser.id)
                .send(passwordChangeSuccess)
                .expect(200);
        })
    });
});
