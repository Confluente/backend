var path = require("path");
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var Q = require("q");
var schedule = require('node-schedule');
var User = require('./models/user');
var Sequelize = require('sequelize');
var Op = Sequelize.Op;
var nodemailer = require("nodemailer");
var log = require("./logger");
var checkPermission = require("./permissions").check;
var Session = require("./models/session");

var webroot;

var app = express();

// Set webroot dependent on whether running for tests, development, or production
if (process.env.NODE_ENV === "test") {
    console.log("NODE_ENV=test");
    webroot = path.resolve(__dirname, "www");
} else if (process.env.NODE_ENV === "dev") {
    app.use(morgan("dev"));
    webroot = path.resolve(__dirname, "../frontend/src");
} else {
    webroot = path.resolve(__dirname, "../frontend/build");
    app.use(morgan("combined", {stream: require("fs").createWriteStream("./access.log", {flags: "a"})}));

    app.use(function (req, res, next) {
        log.info({req: req}, "express_request");
        next();
    });
}

app.use(bodyParser.json({limit: '10mb', extended: false}))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, append,delete,entries,foreach,get,has,keys,set,values,Authorization");
    res.header("Access-Control-Allow-Credentials", "true")
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});

app.options('*', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
    res.setHeader('Access-Control-Allow-Methods', "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
})

app.use(bodyParser.urlencoded({limit: '10mb', extended: false}))
app.use(cookieParser());
app.use(function (req, res, next) {
    if (req.cookies.session) {
        var token = Buffer.from(req.cookies.session, "base64");
        Session.findOne({where: {token: token}}).then(function (session) {
            if (session) {
                res.locals.session = session.dataValues;
            } else {
                res.clearCookie("session");
            }
            next();
        });
    } else {
        next();
    }
});

// HTTPS Rerouting (only for live website version
// app.use(function (req, res, next) {
//     if (req.secure) {
//         // request was via https, so do no special handling
//         next();
//     } else {
//         // acme challenge is used for certificate verification for HTTPS
//         if (req.url === "/.well-known/acme-challenge/w4MANzrt6vOUT2NSDTvramIFdtMMTJXnxiNiyJPlPTg") {
//             res.redirect('http://hsaconfluente.nl/www/w4MANzrt6vOUT2NSDTvramIFdtMMTJXnxiNiyJPlPTg');
//         }
//         res.redirect('https://' + req.headers.host + req.url);
//         // request was via http, so redirect to https
//     }
// });


app.use(function (req, res, next) {
    var user = res.locals.session ? res.locals.session.user : null;
    checkPermission(user, {type: "PAGE_VIEW", value: req.path})
        .then(function (hasPermission) {
            if (!hasPermission) {
                if (user) {
                    return res.status(403).send();
                } else {
                    return res.status(401).send();
                }
            }
            return next();
        }).done();
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/group", require("./routes/group"));
app.use("/api/user", require("./routes/user"));
app.use("/api/page", require("./routes/page"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/*", function (req, res) {
    res.sendStatus(404);
});

app.use(express.static('public'));
app.use(express.static(webroot));

app.get("*", function (req, res, next) {

    if (req.originalUrl.includes(".")) {
        return res.sendStatus(404);
    }

    res.sendFile("/index.html", {root: webroot});
});

app.use(function (err, req, res, next) {
    console.error(err);
    //throw err;
});

// This function sends an email to the secretary of H.S.A. Confluente every week if 
// new users have registered on the website
var secretary_email = schedule.scheduleJob('0 0 0 * * 7', function () {
    var lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    User.findAll({
        attributes: ["displayName", "email", "track", "createdAt"],
        where: {
            createdAt: {
                [Op.gte]: lastWeek
            }
        }
    }).then(function (newUsers) {
        if (newUsers.length) {
            // new users in the last 7 days so send an email to secretary
            var number_of_new_users = newUsers.length;
            var data_of_new_users = "";
            for (var i = 0; i < number_of_new_users; i++) {
                data_of_new_users += "Name: " + newUsers[i].displayName;
                data_of_new_users += ", Email: " + newUsers[i].email;
                data_of_new_users += ", track: " + newUsers[i].track + "\n";
            }

            nodemailer.createTestAccount().then(function () {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    type: "SMTP",
                    host: "smtp.gmail.com",
                    secure: true,
                    // Never fill this password in and add it to git! Only filled in locally or on the server!
                    auth: {
                        user: 'web@hsaconfluente.nl',
                        pass: ''
                    }
                });
                transporter.sendMail({
                    from: '"website" <web@hsaconfluente.nl>',
                    to: '"secretary of H.S.A. Confluente" <treasurer@hsaconfluente.nl>',
                    subject: "New members that registered on the website",
                    text: "Heyhoi dear secretary \n \nIn the past week there have been " + number_of_new_users.toString() + " new registrations on the website. \n\nThe names and emails of the new registrations are \n" + data_of_new_users + " \nSincerely, \nThe website \nOn behalf of the Web Committee"
                }).then(function (info) {
                    console.log(info)
                })
            });
        }
    })
});


module.exports = app;
