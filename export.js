var stringify = require("csv-stringify");

var User = require("./models/user");

var columns = [
  "id",
  "email",
  "passwordHash",
  "passwordSalt",
  "isAdmin"
];

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
