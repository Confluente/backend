var Sequelize = require("sequelize");
var sequelize = require("./db");

var Group = sequelize.define('group', {
    displayName: Sequelize.STRING,
    fullName: Sequelize.STRING,
    description: Sequelize.STRING,
    canOrganize: Sequelize.BOOLEAN,
    email: Sequelize.STRING
});

Group.sync();

module.exports = Group;
