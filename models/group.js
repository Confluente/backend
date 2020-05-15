var Sequelize = require("sequelize");
var sequelize = require("./db");

var Group = sequelize.define('group', {
    displayName: Sequelize.STRING,
    fullName: {type: Sequelize.STRING, unique: true},
    description: Sequelize.STRING,
    canOrganize: Sequelize.BOOLEAN,
    email: Sequelize.STRING,
    type: Sequelize.STRING
});

Group.sync();

module.exports = Group;
