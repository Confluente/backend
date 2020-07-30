var Sequelize = require("sequelize");
var db = require("./db");

var Session = db.define('session', {

    /**
     * Token of the session.
     */
    token: Sequelize.BLOB,

    /**
     * Id of the user of the session.
     */
    user: Sequelize.INTEGER,

    /**
     * IP address of the user.
     */
    ip: Sequelize.STRING,

    /**
     * Expiration date of the session.
     */
    expires: Sequelize.DATE
});

Session.sync();

module.exports = Session;
