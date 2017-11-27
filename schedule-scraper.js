const _ = require('ramda');
const moment = require('moment');
const scraper = require('./scraper.js');
const { initSchedule, queryDb } = require('./utils.js');

// utils
// =================

const logScrape = _.tap(function(doc) {
	console.log(`scrape ${doc.title} on ${moment().format('D/MM/YY, h:mm:ss a')}`);
});

const initScraper = (doc) => scraper(doc.title, doc.location, doc.email);

const queryQueries = queryDb('queries', {}, null);

// =================

const scrapeGumtree = _.compose(initScraper, logScrape);

const mapQueriesToScraper = _.composeP(_.forEach(scrapeGumtree), queryQueries);

const schedulGumtreeScraper = initSchedule(mapQueriesToScraper);

module.exports = schedulGumtreeScraper;