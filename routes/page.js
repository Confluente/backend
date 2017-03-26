var express = require("express");
var marked = require("marked");

var Page = require("../models/page");
var permissions = require("../permissions");

var router = express.Router();

router.route("/:url")
.get(function (req, res) {
  Page.find({
    where: {
      url: req.params.url
    },
    attributes: ["url", "title", "content", "author"]
  }).then(function (page) {
    if (!page) {
      return res.sendStatus(404);
    }
    res.send(page);
  });
})
.put(permissions.requireAll({type: "PAGE_MANAGE"}), function (req, res) {
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
  return Page.findAll().then(function (results) {
    res.send(results);
  });
});

module.exports = router;
