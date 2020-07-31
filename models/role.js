var Sequelize = require("sequelize");
var db = require("./db");
var dictionaryHelper = require("../helpers/dictionaryHelper")

let defaultPermissions = {
    // Pages
    "PAGE_VIEW": true,
    "PAGE_MANAGE": false,
    // Users
    "USER_CREATE": true,
    "USER_VIEW_ALL": false,
    "USER_MANAGE": false,
    "CHANGE_ALL_PASSWORDS": false,
    // Roles
    "ROLE_VIEW": false,
    "ROLE_MANAGE": false,
    // Groups
    "GROUP_VIEW": true,
    "GROUP_MANAGE": false,
    "GROUP_ORGANIZE_WITH_ALL": false,
    // Activities
    "ACTIVITY_VIEW_PUBLISHED": true,
    "ACTIVITY_VIEW_ALL_UNPUBLISHED": false,
    "ACTIVITY_MANAGE": false
}

var Role = db.define('role', {
    /**
     * Name of the role.
     */
    name: {type: Sequelize.STRING, unique: true},

    /**
     * Stringified dictionary of permissions associated to the role.
     */
    permissions: {
        type: Sequelize.STRING,
        defaultValue: dictionaryHelper.stringifyDictionaryOfBooleans(defaultPermissions)
    }
});

Role.sync();

module.exports = Role;
