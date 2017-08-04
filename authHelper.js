var crypto = require("crypto");
var Q = require("q");

var User = require("./models/user");
var Session = require("./models/session");

var getRandomBytes = Q.nfbind(crypto.randomBytes);

var digest_iterations = (process.env.NODE_ENV === "test") ? 1 : 100000;

function getPasswordHash(password, salt) {
  return Q.Promise(function (resolve, reject) {
    crypto.pbkdf2(password, salt, digest_iterations, 256 / 8, 'sha256', function (err, hash) {
      if (err) {
        return reject(err);
      }
      return resolve(hash);
    });
  });
}

function getPasswordHashSync(password, salt) {
  return crypto.pbkdf2Sync(password, salt, digest_iterations, 256 / 8, 'sha256');
}

module.exports = {
  authenticate: function (email, password) {
    email = email.toLowerCase();
    return User.findOne({where: {email: email}}).then(function (user) {
      if (!user) {
        //wrong username/password
        return null;
      }
      return getPasswordHash(password, user.dataValues.passwordSalt)
      .then(function (hash) {
        //console.log(email, password, user.dataValues.passwordHash, hash);
        return (hash.equals(user.dataValues.passwordHash)) ? user : null;
      });
    });
  },

  startSession: function (userId, ip) {
    var session_lifetime = 24 * 3600 * 1000;
    return getRandomBytes(32).then(function (bytes) {
      return Session.create({
        user: userId,
        ip: ip,
        token: bytes,
        expires: new Date(new Date().valueOf() + session_lifetime)
      });
    });
    //.then(function ())
  },

  getPasswordHash: getPasswordHash,
  getPasswordHashSync: getPasswordHashSync

};
