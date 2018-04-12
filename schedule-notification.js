const _ = require('ramda');
const { task, waitAll } = require('folktale/concurrency/task');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { chain, initSchedule, aggregateDb, updateDb } = require('./utils');
const gmailCredentials = require('./credentials').gmail;
const db = require('./db');

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
			user: gmailCredentials.outgoing.address, 
			pass: gmailCredentials.outgoing.password 
	}
});

// =================

const logNotification = _.tap(function(db) {
	console.log(`check for notifications at ${moment().format('DD/MM/YY, h:mm:ss a')}`);
});

const getGumtreeData = aggregateDb('gumtree', [
	{ $unwind : '$recipients' },
	{ $match: { 'recipients.notified': false }},
	{ $project: { title: 1, price: 1, location: 1, link: 1, email: '$recipients.email' }}
]);

const seperateByEmail = function(emails, data) {
	const output = [];

	emails.forEach((v, i) => {
		const filteredData = data.filter((entry) => {
			return entry.email === v;
		}); 

		output.push({ data: filteredData, email: v });
	});

	return output;
}

const emailText = function(ac, cv) {
	return ac += `${cv.title} - ${cv.price} - ${cv.link} - ${cv.location}\n\n`;
}

const mailOptions = (obj) => ({
	from: gmailCredentials.outgoing.address, 
	to: obj.email, 
	subject: `GUMTREE - ${moment().format('DD/MM/YY')}`, 
	text: obj.data
});

const sendEmail = _.curry(function(transporter, mailOptions) {
	return task((resolver) => {
		if (mailOptions.text !== '') {
			transporter.sendMail(mailOptions, (err, info) => {
				if (!err) resolver.resolve(mailOptions.to);
			});
		}
	});
});

const updateNotified = _.curry(function(db, email) {
	return updateDb(
		'gumtree', 
		{ 'recipients.email': email },
		{ $set: { 'recipients.$.notified': true }},
		db
	);
});

// =================

const uniqueEmails = _.compose(_.uniq, _.map(_.prop('email')));

const parseData = _.converge(seperateByEmail, [uniqueEmails, _.identity]);

const createEmail = _.compose(mailOptions, _.evolve({data: _.reduce(emailText, '')}));

const processEmail = _.compose(chain(updateNotified(db)), sendEmail(transporter), createEmail);

const groupByEmail = _.compose((data) => waitAll(_.map(processEmail, data)), parseData);

const runNotifier = _.compose(chain(groupByEmail), getGumtreeData);

const scheduleNotifications = initSchedule(_.compose(runNotifier, logNotification));

module.exports = scheduleNotifications;