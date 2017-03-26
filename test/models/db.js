var assert = require("assert");
process.env.NODE_ENV = "test";
var db = require("../../models/db");

describe("models/db", function () {

  it("Returns a sequelize handle", function (done) {
    assert(typeof db.Sequelize === "function");
    done();
  });

});
