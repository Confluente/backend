var Q = require("q");
var Sequelize = require("sequelize");
var sequelize = require("./db");

var Group = require("./group");

var Activity = sequelize.define('activity', {
    name: Sequelize.STRING,
    description: Sequelize.STRING,
    location: Sequelize.STRING,
    date: Sequelize.DATE,
    startTime: Sequelize.TIME,
    endTime: Sequelize.TIME,
    subscribeBefore: Sequelize.DATE,
    canSubscribe: {
        type: Sequelize.VIRTUAL,
        get: function () {
            return true;
        }
    },
    approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    instanceMethods: {
        isAwesome: function () {
            return Q(true);
        }
    }
});

Activity.Organizer = Activity.belongsTo(Group, {as: "Organizer"});

Activity.sync();
Group.sync();
sequelize.sync();

module.exports = Activity;
