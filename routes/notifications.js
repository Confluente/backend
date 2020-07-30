var express = require("express");
var User = require("../models/user");

var router = express.Router();

router.route("/portraitRight/:id")
    /**
     * Function for changing the consentWithPortraitRight attribute of a user
     */
    .put(function (req, res) {
        // check if user is logged in
        var userId = res.locals.session ? res.locals.session.user : null;

        // check if user id of logged in user is same as user id for which request was send
        if (parseInt(req.params.id) !== userId) return res.sendStatus(403);

        // get user from db
        User.findByPk(userId).then(function (user) {
            
            // update user
            user.update({consentWithPortraitRight: req.body.answer}).then(function (result) {
                res.send(user);
            })
        })
    });

module.exports = router;