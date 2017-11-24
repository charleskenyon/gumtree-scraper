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

const createEmailContent = _.curry(function(ac, cv) {
	return ac += `${cv.title} - ${cv.price} - ${cv.link} - ${cv.location}\n\n`;
});

const createEmailJson = function(content) {
	const mailOptions = {
	    from: gmailCredentials.outgoing.address, 
	    to: gmailCredentials.receiving.address, 
	    subject: `GUMTREE - ${moment().format('DD/MM/YY')}`, 
	    text: content
	}
	return mailOptions;
}

const sendEmail = _.curry(function(transporter, email) {
	if (email.text !== '') transporter.sendMail(email);
});

// =================

const createEmail = _.compose(createEmailJson, _.reduce(createEmailContent, ''));

const processEmail = _.compose(sendEmail(transporter), createEmail);

const getGumtreeData = _.composeP(processEmail, queryGumtreeAndUpdate);

const scheduleNotifications = initSchedule(_.compose(getGumtreeData, logNotification));

module.exports = scheduleNotifications;