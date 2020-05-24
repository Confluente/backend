var express = require("express");
var marked = require("marked");

var Page = require("../models/page");
var permissions = require("../permissions");

var router = express.Router();

router.route("/:url([^\?]+)")
    /**
     * Gets a specific page from the database
     */
    .get(function (req, res) {
        Page.findOne({
            where: {
                url: req.params.url
            },
            attributes: ["url", "title", "content", "author"]
        }).then(function (page) {

            // If page is not found, send 404
            if (!page) return res.sendStatus(404)

            // Enables markdown
            if (req.query.render === "true") {
                page.dataValues.html = marked(page.dataValues.content);
                page.dataValues.content = undefined;
            }

            // Send page to the client
            res.send(page);
        });
    })
    /**
     * Edits a page
     */
    .put(permissions.requireAll({type: "PAGE_MANAGE"}), function (req, res) {

        // Stores the edit parameters
        var values = req.body;

        if (!req.body.url || req.body.url === req.params.url) {
            values.url = req.params.url;
        } else {
            throw new Error("Not implemented: change page.url");
        }

        return Page.upsert(values).then(function (result) {
            //return res.status(201).send(result);
            return Page.findAll().then(function (results) {
                //console.log(results);
                return res.status(201).send(results);
            });
        });
    })
    /**
     * Deletes a page from the database
     */
    .delete(permissions.requireAll({type: "PAGE_MANAGE"}), function (req, res) {
        return Page.destroy({where: {url: req.params.url}}).then(function (result) {
            return res.sendStatus(204);
        });
    });

router.get("/:url/view", function (req, res) {
    return Page.find({where: {url: req.params.url}}).then(function (result) {
        if (!result) return res.redirect("/404.html");
        res.send(marked(result.dataValues.content));
    });
});

router.get("/", permissions.requireAll({type: "PAGE_MANAGE"}), function (req, res) {
    return Page.findAll({
        attributes: ["url", "title", "content", "author"]
    }).then(function (results) {
        res.send(results);
    });
});

module.exports = router;
