var Sequelize = require("sequelize");
var sequelize = require("./db");

var Role = sequelize.define('role', {
    name: {type: Sequelize.STRING, unique: true},
    permissions: {type: Sequelize.STRING}
});

Role.sync();

module.exports = User;
