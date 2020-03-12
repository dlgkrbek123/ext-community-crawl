"use strict";

const crawlCommunities = require("./crawlers/index");
crawlCommunities.every3Hour.start();

console.info("Cron Server App Started");

var fileList = [
  "instiz",
  "inven",
  "dcinside",
  "fmkorea",
  "mlbpark",
  "ppomppu",
  "ruliweb",
  "slrclub",
  "theqoo"
];

var http = require("http");
var express = require("express");
var fs = require("promise-fs");

var app = express();

const options = {};

app.all("/*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get("/", function(req, res) {
  var result = {};

  const fPromises = fileList.map(f => {
    return fs
      .readFile(`${f}.json`)
      .then(content => {
        result[f] = JSON.parse(content);
      })
      .catch(err => console.log(err));
  });

  Promise.all(fPromises).then(() => {
    res.send(JSON.stringify(result));
  });
});

var server = http.createServer(app);

server.listen(process.env.PORT, function() {
  console.log("server is running");
});
