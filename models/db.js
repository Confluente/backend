var Sequelize = require("sequelize");
var storage = (process.env.NODE_ENV === "test") ? ":memory:" : "data.sqlite";

var db = new Sequelize("sequel", null, null, {dialect: "sqlite", logging: null, storage: storage});

module.exports = db;
