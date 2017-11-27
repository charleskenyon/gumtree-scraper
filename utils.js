const _ = require('ramda');
const schedule = require('node-schedule');

const initSchedule = _.curry(function(callback, data, cron) {
	schedule.scheduleJob(cron, callback.bind(this, data));
});

const queryDb = _.curry(function(collection, filter, update, db) {
	return new Promise((resolve, reject) => {
		db[collection].find(filter, (error, docs) => {
			if (!error) {
				if (update) update(db, collection);
				resolve(docs);
			}
		});
	});
});

const evolveP = _.curry(function(transformations, object) {
	return new Promise((resolve, reject) => {
		const output = Object.assign({}, object);
		const promises = [];

	  Object.keys(transformations).map((v, i) => {
	  	const key = v;
	  	const transformation = transformations[key];
  		promises.push(Promise.resolve(transformation(output[key])));
  		output[key] = i; // set mapping
	  });

	  Promise.all(promises).then((arr) => {
	  	arr.forEach((v, i) => {
	  		const mapping = Object.keys(output).filter((key) => {
	  			return output[key] === i;
	  		})[0];
	  		output[mapping] = arr[i];
	  	});
	  	resolve(output);
	  });
	  
	});
});

module.exports = { initSchedule, queryDb, evolveP };