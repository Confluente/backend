var Q = require("q");
var db = require("./db");

module.exports = db.then(function(db) {
  this.getAll = function() {
    var deferred = Q.defer();
    db.all("SELECT * FROM Member", function(err, rows) {
      return deferred.resolve(rows);
    });
    return deferred.promise;
  };

  this.add = function(params) {
    var deferred = Q.defer();
    db.prepare("INSERT INTO Member (id, first_name, last_name) VALUES((?), (?), (?));", params.id, params.first_name, params.last_name).run(function(err, thing) {
      return deferred.resolve(thing);
    });
    return deferred.promise;
  }
});
