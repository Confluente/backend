var Sequelize = require("sequelize");
var db = require("./db");

var Page = db.define('page', {

    /*
     * URL of the page
     */
    url: {
        type: Sequelize.STRING,
        unique: true
    },

    /*
     * Title of the page
     */
    title: Sequelize.STRING,

    /*
     * Content of the page in text format
     */
    content: Sequelize.TEXT,

    /*
     * Author of hte page
     */
    author: Sequelize.STRING
});

Page.sync();

module.exports = Page;
