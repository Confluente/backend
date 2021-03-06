var crypto = require("crypto");
var Q = require("q");

var User = require("./models/user");
var Session = require("./models/session");

var getRandomBytes = Q.nfbind(crypto.randomBytes);

var digest_iterations = (process.env.NODE_ENV === "test") ? 1 : 100000;

/**
 * Asynchronous function returning Hash of password based on password and salt
 * @param password
 * @param salt
 * @return Hash, or rejects
 */
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

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 * @return {String} salt characters
 */
function generateSalt(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length);   /** return required number of characters */
}

/**
 * Synchronous function returning Hash of password based on password and salt
 * @param password
 * @param salt
 * @return Hash
 */
function getPasswordHashSync(password, salt) {
    return crypto.pbkdf2Sync(password, salt, digest_iterations, 256 / 8, 'sha256');
}

module.exports = {
    /**
     * Function for verifying user identity based on email and password
     * @param email
     * @param password
     * @return user if valid, otherwise null
     */
    authenticate: function (email, password) {
        email = email.toLowerCase();
        return User.findOne({where: {email: email}}).then(function (user) {
            if (!user) {
                return {error: 406, data: "Email adress not associated to any account"};
            }
            return getPasswordHash(password, user.dataValues.passwordSalt)
                .then(function (hash) {
                    return (hash.equals(user.dataValues.passwordHash)) ? user : {error: 406, data: "Password incorrect"};
                });
        });
    },

    /**
     * Function for generating session with logged in user on given IP, with a random token and set lifetime
     * @param userId
     * @param ip
     * @return session
     */
    startSession: function (userId, ip) {
        var session_lifetime = 7; // in days
        return getRandomBytes(32).then(function (bytes) {
            console.log("new session made")
            return Session.create({
                user: userId,
                ip: ip,
                token: bytes,
                expires: (new Date()).setDate(new Date().getDate() + session_lifetime)
            });
        });
        //.then(function ())
    },

    getPasswordHash: getPasswordHash,
    getPasswordHashSync: getPasswordHashSync,
    generateSalt: generateSalt
};
