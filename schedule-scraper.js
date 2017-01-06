const schedule = require('node-schedule'),
	_ = require('ramda'),
	moment = require('moment'),
	db = require('./db.js'),
	scraper = require('./scraper.js'),
	{queryCallback} = require('./utils.js');

// Utils
// =================

const scheduleScrape = function(doc) {
	schedule.scheduleJob('* * * * *', function() {
		scraper(doc.title, doc.location);
		const time = moment().format('D/MM/YY, h:mm:ss a');
		console.log(`scrape ${doc.title} on ${time}`);
	});
}

// =================

const scrapeGumtree = _.compose(_.forEach(scheduleScrape), queryCallback);

const schedulGumtreeScraper = (db) => db.queries.find(scrapeGumtree);

module.exports = schedulGumtreeScraper;