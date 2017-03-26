var Sequelize = require("sequelize");
var sequelize = require("./db");

var User = sequelize.define('user', {
  email: Sequelize.STRING,
  displayName: Sequelize.STRING,
  passwordHash: Sequelize.BLOB,
  passwordSalt: Sequelize.BLOB,
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});
var Group = require("./group");

var UserGroup = sequelize.define('user_group', {
  func: Sequelize.STRING
});

User.belongsToMany(Group, {through: UserGroup});
Group.belongsToMany(User, {through: UserGroup});
UserGroup.sync();
User.sync();
Group.sync();
sequelize.sync();

module.exports = User;
