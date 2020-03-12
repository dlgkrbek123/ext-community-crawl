const cron = require("cron");

const dcinside = require("./dcinside/crawl");
const mlbpark = require("./mlbpark/crawl");
const clien = require("./clien/crawl");
const inven = require("./inven/crawl");
const ruliweb = require("./ruliweb/crawl");
const slrclub = require("./slrclub/crawl");
const ppomppu = require("./ppomppu/crawl");
const instiz = require("./instiz/crawl");
const fmkorea = require("./fmkorea/crawl");
const theqoo = require("./theqoo/crawl");

// const cronTime = '0 0 */3 * * *';
const cronTime = "0 15/* * * * *";
const CRAWL_ITEM_COUNT = 20;

console.log("Register CommunityCrawling Cron:", new Date().toISOString());

async function crawlCommunities() {
  await Promise.all([
    ruliweb(CRAWL_ITEM_COUNT),
    slrclub(CRAWL_ITEM_COUNT)
    ppomppu(CRAWL_ITEM_COUNT),
    instiz(CRAWL_ITEM_COUNT),
    inven(CRAWL_ITEM_COUNT),
    clien(CRAWL_ITEM_COUNT),
    mlbpark(CRAWL_ITEM_COUNT),
    dcinside(CRAWL_ITEM_COUNT),
    fmkorea(CRAWL_ITEM_COUNT),
    theqoo(CRAWL_ITEM_COUNT)
  ]);
}

async function proc() {
  console.log("Begin communityCrawling.every3Hour:", new Date().toISOString());

  await crawlCommunities();

  console.log("Finish communityCrawling.every3Hour:", new Date().toISOString());
}

function onTick() {
  proc()
    .then(() => {})
    .catch(err => {
      console.log("ERROR: communityCrawling.every3Hour", err);
    });
}

exports.every3Hour = new cron.CronJob({
  cronTime,
  start: false,
  onTick
});
