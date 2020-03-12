'use strict';

const crawlCommunities = require('./crawlers/index');

crawlCommunities.every3Hour.start();

console.info('Cron Server App Started');