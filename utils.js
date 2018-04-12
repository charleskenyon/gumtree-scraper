const _ = require('ramda');
const schedule = require('node-schedule');
const { task, of, waitAll } = require('folktale/concurrency/task');

const chain = _.curry(function(f, monadicType) {
	return monadicType.chain(f);
});

const initSchedule = _.curry(function(task, db, cron) {
	schedule.scheduleJob(cron, () => {
		task(db).run();
	});
});

const queryDb = _.curry(function(collection, query, db) {
	return task((resolver) => {
		db[collection].find(query, (error, docs) => {
			if (!error) resolver.resolve(docs);
		});
	});
});

const aggregateDb = _.curry(function(collection, operations, db) {
	return task((resolver) => {
		db[collection].aggregate(operations, (error, docs) => {
			if (!error) resolver.resolve(docs);
		});
	});
});

const updateDb = _.curry(function(collection, query, update, db) {
	return task((resolver) => {
		db[collection].update(query, update, { multi: true, upsert: true }, (error, docs) => {
			if (!error) resolver.resolve(docs);
		});
	});
});

const evolveTask = _.curry(function(transformations, object) {
	const output = Object.assign({}, object); // create new object
	const outputKeys = Object.keys(output);
	const tasks = [];
	
	outputKeys.map((v, i) => {
		if (Object.keys(transformations).includes(v)) {
			tasks.push(transformations[v](output[v]));
		} else {
			tasks.push(of(output[v]));
		}
		output[v] = i; // set mapping
	});

	return waitAll(tasks).map((arr) => {
		arr.forEach((v, i) => {
			const mapping = outputKeys.filter((key) => {
				return output[key] === i;
			})[0];
			output[mapping] = arr[i];
		});
		return output;
	});

});

module.exports = { chain, initSchedule, queryDb, aggregateDb, updateDb, evolveTask };