var request = require("supertest");
var assert = require("assert");

var testData = require("../testData");
var authenticate = require("../tester").authenticate;
var app = require("../../expressServer");

describe("routes/page", function () {

  var testPage = {
    url: "testPage",
    title: "Test Page",
    content: "Foo Bar",
    author: "Someone"
  };

  function assertPage(page, useragent) {
    if (!useragent) useragent = testData.testUserAgent;
    return useragent.get("/api/page/" + page.url)
    .expect(200)
    .then(function (res) {
      //console.log(res.body, page);
      assert.deepStrictEqual(res.body, page);
    });
  }

  describe("PUT /page/:url", function () {

    it("Creates a page", function () {
      return testData.adminUserAgent
      .put("/api/page/" + testPage.url)
      .send(testPage)
      .expect(201)
      .then(function (res) {
        //console.log(res.body);
        return assertPage(testPage);
      });
    });

    it("Changes an existing page", function () {
      var updatedPage = {
        content: "Foo bar baz"
      };
      return testData.adminUserAgent
      .put("/api/page/" + testPage.url)
      .send(updatedPage)
      .expect(201)
      .then(function (res) {
        //console.log(res.body);
        testPage.content = updatedPage.content;
        return assertPage(testPage);
      });
    });

    it.skip("Can change the page url", function () {
      var newUrl = "testing_Page";
      return testData.adminUserAgent
      .put("/api/page/" + testPage.url)
      .send({url: newUrl})
      .expect(200)
      .then(function (res) {
        testPage.url = newUrl;
        return assertPage(testPage);
      });
    });

    it("Requires permission", function () {
      return testData.testUserAgent
      .put("/api/page/" + testPage.url)
      .send({content: "Webiste haxxed by An0nymoous"})
      .expect(403);
    });

  });

  describe("GET /page/:url", function () {

    it("Retrieves a page", function () {
      return assertPage(testPage);
    });

  });

  describe("GET /page/:url/view", function () {
    it("Returns the rendered page", function () {
      return testData.activeUserAgent
      .get("/api/page/" + testPage.url + "/view")
      .expect(200)
      .then(function (res) {
        assert.strictEqual(res.text, "<p>" + testPage.content + "</p>\n");
      });
    });
  });

  describe("GET /page", function () {

    it("lists all pages", function () {
      return testData.adminUserAgent
      .get("/api/page")
      .expect(200)
      .then(function (res) {
        //console.log(res.body);
        assert(res.body.length > 0);
        res.body.forEach(function (activity) {
          assertPage(activity);
        });
      });
    });

    it("requires permission", function () {
      return testData.testUserAgent
      .get("/api/page")
      .expect(403);
    });
  });

  describe("DELETE /page/:url", function () {

    it("Requires permission", function () {
      return testData.testUserAgent
      .delete("/api/page/" + testPage.url)
      .expect(403);
    });

    it("Removes the page", function () {
      return testData.adminUserAgent
      .delete("/api/page/" + testPage.url)
      .expect(204)
      .then(function () {
        return testData.activeUserAgent
        .get("/api/page/" + testPage.url)
        .expect(404);
      });
    });

  });
});
