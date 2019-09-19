var stringify = require("csv-stringify");

var User = require("./models/user");

// Columns for stringify'd table
var columns = [
  "id",
  "email",
  "passwordHash",
  "passwordSalt",
  "isAdmin"
];

/**
 * Script for exporting (logging) all fields of all users to console
 */
User.findAll({attributes: columns}).then(function (users) {
  if (users.length < 1) throw Error();
  stringify(users, {
    header: true,
    columns: columns,
    formatters: {
      object: function (value) {
        return value.toString("base64");
      }
    }
  }, function (err, output) {
    if (err) throw new Error(err);
    console.log(output);
  });
});
