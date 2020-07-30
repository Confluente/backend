var Sequelize = require("sequelize");
var db = require("./db");

var Role = db.define('role', {
    /**
     * Name of the role.
     */
    name: {type: Sequelize.STRING, unique: true},

    /**
     * Stringified dictionary of permissions associated to the role.
     */
    permissions: {type: Sequelize.STRING}
});

Role.sync();

module.exports = User;
