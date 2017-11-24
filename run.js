const db = require('./db.js');
const schedulGumtreeScraper = require('./schedule-scraper.js');
const scheduleNotifications = require('./schedule-notification.js');

schedulGumtreeScraper(db, '* * * * *');
scheduleNotifications(db, '*/3 * * * *');