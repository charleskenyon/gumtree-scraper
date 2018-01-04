const _ = require('ramda');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { initSchedule, queryDb } = require('./utils.js');
const gmailCredentials = require('./credentials').gmail;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: gmailCredentials.outgoing.address, 
        pass: gmailCredentials.outgoing.password 
    }
});

// utils
// =================

const logNotification = _.tap(function(db) {
	console.log(`check for notifications on ${moment().format('DD/MM/YY, h:mm:ss a')}`);
});

const updateGumtree = function(db, collection) {
	db[collection].update({notified: false}, {$set: {notified: true}}, {multi: true});
}

const queryGumtreeAndUpdate = queryDb('gumtree', {notified: false}, updateGumtree);

const seperateByEmail = function(emails, data) {
	const output = [];

	emails.forEach((v, i) => {
		const filteredData = data.filter((entry) => {
			return entry.email.includes(v);
		}); 

		output.push({ data: filteredData, email: v });
	});

	return output;
}

const createEmailContent = function(ac, cv) {
	return ac += `${cv.title} - ${cv.price} - ${cv.link} - ${cv.location}\n\n`;
};

const createEmailJson = function(obj) {
	return {
	    from: gmailCredentials.outgoing.address, 
	    to: obj.email, 
	    subject: `GUMTREE - ${moment().format('DD/MM/YY')}`, 
	    text: obj.data
	}
}

const sendEmail = _.curry(function(transporter, email) {
	if (email.text !== '') transporter.sendMail(email);
});

// =================

const uniqueEmails = _.compose(_.uniq, _.flatten, _.map(_.prop('email')));

const parseData = _.converge(seperateByEmail, [uniqueEmails, _.identity]);

const createEmail = _.compose(createEmailJson, _.evolve({data: _.reduce(createEmailContent, '')}));

const processEmail = _.compose(sendEmail(transporter), createEmail);

const getGumtreeData = _.composeP(_.forEach(processEmail), parseData, queryGumtreeAndUpdate);

const scheduleNotifications = initSchedule(_.compose(getGumtreeData, logNotification));

module.exports = scheduleNotifications;