var assert = require("assert");
var Q = require("q");

var permissions = require("../permissions");
var testData = require("./testData");

describe("permissions", function () {

  function assertResult(promise, expected) {
    return promise.then(function (result) {
      assert(expected === result);
    });
  }

  function assertPermission(user, scope, expected) {
    if (expected === undefined) {expected = true;}
    return assertResult(permissions.check(user, scope), expected);
  }

  describe("#all", function () {
    it("returns true if all promises are true", function () {
      return assertResult(permissions.all([Q(true), Q(true)]), true);
    });

    it("returns false if any promise is false", function () {
      return assertResult(permissions.all([Q(true), Q(true), Q(false)]), false);
    });
  });

  describe("#requireAll", function () {

    it("returns a permission checking middleware function", function (done) {
      var middleware = permissions.requireAll({type: "PAGE_VIEW"});
      assert.equal(typeof middleware, "function");
      done();
    });

    it("calls next() when all permissions are in place", function (done) {
      var user = testData.testUser.id;
      var req = {};
      var res = {locals: {session: {user: user}}};
      permissions.requireAll({type: "PAGE_VIEW"})(req, res, done);
    });

    it("passes errors to next()", function (done) {
      var user = testData.testUser.id;
      var req = {};
      var res = {locals: {session: {user: user}}};
      permissions.requireAll({type: "INVALID_PERMISSION"})(req, res, function next(err) {
        assert.equal(err.message, "Unknown scope type");
        done();
      });
    });

  });

  describe("PAGE_VIEW", function () {

    it("true for everyone", function () {
      return assertPermission(null, {type: "PAGE_VIEW", value: "/foo/bar"});
    });

  });

  describe("ACTIVITY_VIEW", function () {
    it("true if activity.approved", function () {
      return assertPermission(null, {type: "ACTIVITY_VIEW", value: testData.testActivity.id});
    });

    it("true when user is member of activity.Organizer", function () {
      return assertPermission(testData.activeUser.id, {type: "ACTIVITY_VIEW", value: testData.unapprovedActivity.id});
    });

    it("false otherwise", function () {
      return assertPermission(null, {type: "ACTIVITY_VIEW", value: testData.unapprovedActivity.id}, false);
    });
  });

  describe("GROUP_ORGANIZE", function () {
    it("true when user is member of group and group.canOrganize", function () {
      return assertPermission(testData.activeUser.id, {type: "GROUP_ORGANIZE", value: testData.testGroup.id});
    });

    it("false otherwise", function () {
      return Q.all([
        assertPermission(null, {type: "GROUP_ORGANIZE", value: testData.testGroup.id}, false),
        assertPermission(testData.testUser.id, {type: "GROUP_ORGANIZE", value: testData.testGroup.id}, false),
        assertPermission(testData.testUser.id, {type: "GROUP_ORGANIZE", value: testData.membersGroup.id}, false)
      ]);
    });
  });

  describe("ACTIVITY_EDIT", function () {
    it("true when user is member of activity.Organizer", function () {
      return assertPermission(testData.activeUser.id, {type: "ACTIVITY_EDIT", value: testData.unapprovedActivity.id});
    });

    it("false otherwise", function () {
      return assertPermission(testData.testUser.id, {type: "ACTIVITY_VIEW", value: testData.unapprovedActivity.id}, false);
    });
  });

  describe("ACTIVITY_APPROVE", function () {
    it();
  });

  describe("ACTIVITY_SUBSCRIBE", function () {
    it("true when user has ACTIVITY_VIEW and activity.subscribeBefore");

    it("true when user has ACTIVITY_EDIT");
  });

  describe("ACTIVITY_UNSUBSCRIBE", function () {
    it();
  });

  describe("PAGE_MANAGE", function () {
    it("true for administrators", function () {
      return assertPermission(testData.admin.id, {type: "PAGE_MANAGE"});
    });

    it("false otherwise", function () {
      return assertPermission(testData.testUser.id, {type: "PAGE_MANAGE"}, false);
    });
  });

  describe("USER_MANAGE", function () {
    it("true for administrators", function () {
      return assertPermission(testData.admin.id, {type: "PAGE_MANAGE"});
    });

    it("false otherwise", function () {
      return assertPermission(testData.testUser.id, {type: "PAGE_MANAGE"}, false);
    });
  });

});
