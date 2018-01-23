const db = require('./db');
const schedulGumtreeScraper = require('./schedule-scraper');
const scheduleNotifications = require('./schedule-notification');

schedulGumtreeScraper(db, '* * * * *');
scheduleNotifications(db, '*/3 * * * *');