const db = require('./db.js'),
	schedulGumtreeScraper = require('./schedule-scraper.js'),
	scheduleNotifications = require('./schedule-notification.js');

schedulGumtreeScraper(db);
scheduleNotifications(db);