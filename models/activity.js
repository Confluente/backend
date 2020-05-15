var Q = require("q");
var Sequelize = require("sequelize");
var sequelize = require("./db");
var User = require("./user");

var Group = require("./group");

var Activity = sequelize.define('activity', {
    name: Sequelize.STRING,
    description: Sequelize.STRING,
    location: Sequelize.STRING,
    date: Sequelize.DATE,
    startTime: Sequelize.TIME,
    endTime: Sequelize.TIME,
    canSubscribe: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    participationFee: Sequelize.DECIMAL,

    // all form variables
    numberOfQuestions: Sequelize.INTEGER,
    typeOfQuestion: Sequelize.STRING,
    questionDescriptions: Sequelize.STRING,
    formOptions: Sequelize.STRING,
    required: Sequelize.STRING,
    subscriptionDeadline: Sequelize.DATE,
    published: {
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
