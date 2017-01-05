const schedule = require('node-schedule'),
	_ = require('ramda'),
	moment = require('moment'),
	db = require('./db.js'),
	scraper = require('./scraper.js');

// Utils
// =================

const queryCallback = function(err, docs) {
	if (!err) return docs;
}

const scheduleScrape = function(doc) {
	schedule.scheduleJob('* * * * *', function() {
		const time = moment().format('D/MM/YY, h:mm:ss a');
		scraper(doc.title, doc.location);
		console.log(`scrape ${doc.title} on ${time}`);
	});
}

// =================

const scrapeGumtree = _.compose(_.forEach(scheduleScrape), queryCallback);

const schedulGumtreeScraper = (db) => db.queries.find(scrapeGumtree);

module.exports = schedulGumtreeScraper;