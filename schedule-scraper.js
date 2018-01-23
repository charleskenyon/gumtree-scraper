const _ = require('ramda');
const { waitAll } = require('folktale/concurrency/task');
const moment = require('moment');
const scraper = require('./scraper');
const { chain, initSchedule, queryDb } = require('./utils');

// =================

const getSearchParams = queryDb('queries', {});

const logScrape = _.tap(function(doc) {
	const now = moment().format('D/MM/YY, h:mm:ss a');
	console.log(`scrape ${doc.title} for ${doc.email} at ${now}`);
});

const initScraper = (doc) => scraper(doc.title, doc.location, doc.email);

// =================

const scrapeGumtree = _.compose(initScraper, logScrape);

const mapScraper = (data) => waitAll(_.map(scrapeGumtree, data));

const mapQueriesToScraper = _.compose(chain(mapScraper), getSearchParams);

const schedulGumtreeScraper = initSchedule(mapQueriesToScraper);

module.exports = schedulGumtreeScraper;