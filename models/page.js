var Sequelize = require("sequelize");
var sequelize = require("./db");

var Page = sequelize.define('page', {
  url: {
    type: Sequelize.STRING,
    unique: true
  },
  title: Sequelize.STRING,
  content: Sequelize.TEXT,
  author: Sequelize.STRING
});

Page.sync();

module.exports = Page;
