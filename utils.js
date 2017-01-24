const _ = require('ramda'),
	schedule = require('node-schedule');

const initSchedule = _.curry(function(callback, data, cron) {
	schedule.scheduleJob(cron, callback.bind(this, data));
});

const queryDb = _.curry(function(collection, filter, update, db) {
	return new Promise(function(resolve, reject) {
		db[collection].find(filter, function(error, docs) {
			if (!error) {
				if (update) update(db, collection);
				resolve(docs);
			}
		});
	});
});

module.exports = {initSchedule, queryDb};