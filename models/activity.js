var Q = require("q");
var Sequelize = require("sequelize");
var sequelize = require("./db");

var Group = require("./group");

var Activity = sequelize.define('activity', {
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  location: Sequelize.STRING,
  startTime: Sequelize.DATE,
  subscribeBefore: Sequelize.DATE,
  canSubscribe: {
    type: Sequelize.VIRTUAL,
    get: function () {
      return true;
    }
  },
  approved: Sequelize.BOOLEAN
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
