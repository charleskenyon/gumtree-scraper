const _ = require('ramda'),
	moment = require('moment'),
	scraper = require('./scraper.js'),
	{initSchedule, queryDb} = require('./utils.js');

// utils
// =================

const initScraper = function(doc) {
	scraper(doc.title, doc.location);
	console.log(`scrape ${doc.title} on ${moment().format('D/MM/YY, h:mm:ss a')}`);
}

const queryQueries = queryDb('queries', {}, null);

// =================

const scrapeGumtree = _.composeP(_.forEach(initScraper), queryQueries);

const schedulGumtreeScraper = initSchedule(scrapeGumtree)

module.exports = schedulGumtreeScraper;