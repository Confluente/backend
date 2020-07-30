var Sequelize = require("sequelize");
var db = require("./db");
var Group = require("./group");
var Activity = require("./activity");
var Role = require("./role");

var User = db.define('user', {

    /**
     * Email of the user.
     */
    email: {type: Sequelize.STRING, unique: true},

    /**
     * First name of the user.
     */
    firstName: Sequelize.STRING,

    /**
     * Last name of the user.
     */
    lastName: Sequelize.STRING,

    /**
     * Display name of the user.
     * Usually concatenation of first name and last name
     */
    displayName: Sequelize.STRING,

    /**
     * Major of the user
     */
    major: Sequelize.STRING,

    /**
     * Stores the address of the user.
     */
    address: Sequelize.STRING,

    /**
     * Honors track of the user.
     */
    track: Sequelize.STRING,

    /**
     * Year that the user started with honors.
     */
    honorsGeneration: Sequelize.INTEGER,

    /**
     * Stores what kind of membership the user has
     */
    honorsMembership: Sequelize.STRING,

    /**
     * Campus card number of the user.
     */
    campusCardNumber: Sequelize.STRING,

    /**
     * Mobile phone number of the user.
     */
    mobilePhoneNumber: Sequelize.STRING,

    /**
     * Whether the user gave consent regarding portrait right.
     */
    consentWithPortraitRight: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },

    /**
     * Hash of the password of the user.
     */
    passwordHash: Sequelize.BLOB,

    /**
     * Salt of the password of the user.
     */
    passwordSalt: Sequelize.BLOB,

    /**
     * Whether the account of the user is approved
     */
    approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },

    /**
     * The hash link via which the account can be approved
     */
    approvingHash: Sequelize.STRING
});

/**
 * UserGroup is the function relating users to groups via UserGroup.
 * Function is the function that the user has in the group.
 */
var UserGroup = db.define('user_group', {
    func: Sequelize.STRING
});

/**
 * Subscription is the function relating users to activities via subscriptions.
 * Answers are the answers that the user gave to the questions of the form.
 */
var Subscription = db.define('subscription', {
    answers: Sequelize.STRING
});

// All relationships defined hereafter are onDelete 'CASCADE' to make sure that when an instance is deleted,
// the relations that instance has to other models are also deleted.

// Relates a user to a group through a UserGroup
User.belongsToMany(Group, {through: UserGroup, onDelete: 'CASCADE'});

// Relates a group to a user through UserGroup as members
Group.belongsToMany(User, {as: "members", through: UserGroup, onDelete: 'CASCADE'});

// Relates a user to an activity trough a subscription
User.belongsToMany(Activity, {through: Subscription, onDelete: 'CASCADE'});

// Relates an activity to a user through subscription as participants
Activity.belongsToMany(User, {as: "participants",through: Subscription, onDelete: 'CASCADE'});

// Relates a role to a user
User.belongsTo(Role);

UserGroup.sync();
Subscription.sync();
User.sync();
Group.sync();
Activity.sync();
Role.sync();
sequelize.sync();
db.sync();

module.exports = User;
