var Sequelize = require("sequelize");
var db = require("./db");

var Group = db.define('group', {

    /*
     * Display name of the group
     */
    displayName: Sequelize.STRING,

    /*
     * Full name of the group
     */
    fullName: {type: Sequelize.STRING, unique: true},

    /*
     * Description of the group
     */
    description: Sequelize.STRING,

    /*
     * Whether the group can organize activities
     */
    canOrganize: Sequelize.BOOLEAN,

    /*
     * The email address of the group
     */
    email: Sequelize.STRING,

    /*
     * The type of the group (Board/Committee)
     */
    type: Sequelize.STRING
});

Group.sync();

module.exports = Group;
