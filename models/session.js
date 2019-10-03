var Sequelize = require("sequelize");
var sequelize = require("./db");

var Session = sequelize.define('session', {
    token: Sequelize.BLOB,
    user: Sequelize.INTEGER,
    ip: Sequelize.STRING,
    expires: Sequelize.DATE
});

Session.sync();

module.exports = Session;
