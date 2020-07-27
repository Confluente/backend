var Sequelize = require("sequelize");
var sequelize = require("./db");

var User = sequelize.define('user', {
    email: {type: Sequelize.STRING, unique: true},
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    major: Sequelize.STRING,
    address: Sequelize.STRING,
    track: Sequelize.STRING,
    honorsGeneration: Sequelize.INTEGER,
    honorsMembership: Sequelize.STRING,
    campusCardNumber: Sequelize.STRING,
    mobilePhoneNumber: Sequelize.STRING,
    consentWithPortraitRight: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    displayName: Sequelize.STRING,
    passwordHash: Sequelize.BLOB,
    passwordSalt: Sequelize.BLOB,
    isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    approvingHash: Sequelize.STRING
});

var Group = require("./group");
var Activity = require("./activity");

var UserGroup = sequelize.define('user_group', {
    func: Sequelize.STRING
});

var Subscription = sequelize.define('subscription', {
    answers: Sequelize.STRING
});

User.belongsToMany(Group, {through: UserGroup});
Group.belongsToMany(User, {as: "members", through: UserGroup});
User.belongsToMany(Activity, {through: Subscription});
Activity.belongsToMany(User, {as: "participants",through: Subscription});
UserGroup.sync();
Subscription.sync();
User.sync();
Group.sync();
Activity.sync();
sequelize.sync();

module.exports = User;
