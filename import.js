var fs = require("fs");
var parse = require("csv-parse");

var User = require("./models/user");

var input = fs.createReadStream("./users.csv");
var parser = parse({columns: true, delimiter: ";"});

var output = [];

input.pipe(parser).on("data", function (data) {
  console.log(data);
  output.push(transform(data));
  commit(output);
});

function transform(record) {
  record.isAdmin = (record.isAdmin.toLowerCase() == "true");
  record.passwordSalt = Buffer.from(record.passwordSalt, "base64");
  record.passwordHash = Buffer.from(record.passwordHash, "base64");
  return record;
}

function commit(data) {
  //return console.log(data);
  User.bulkCreate(data).then(function (result) {
    //console.log(result);
    console.log("Inserted " + result.length + " row(s).");
  });
  data = [];
}
