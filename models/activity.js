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
    subscribeBefore: Sequelize.DATE,
    canSubscribe: Sequelize.BOOLEAN,
    participationFee: Sequelize.DECIMAL,

    numberOfQuestions: Sequelize.INTEGER,
    titlesOfQuestions: Sequelize.STRING, // list of strings
    typeOfQuestion: Sequelize.STRING, // list of strings
    questionDescriptions: Sequelize.STRING, // list of strings
    formOptions: Sequelize.STRING, // list of list of strings
    required: Sequelize.STRING,

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
