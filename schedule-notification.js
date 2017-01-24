const _ = require('ramda'),
	nodemailer = require('nodemailer'),
	moment = require('moment'),
	{initSchedule, queryDb} = require('./utils.js');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'gumtree.scraper66@gmail.com', 
        pass: 'gumtreeScraper123' 
    }
});

// utils
// =================

const logMessage = function(db) {
	console.log(`check for notifications on ${moment().format('DD/MM/YY, h:mm:ss a')}`);
	return db;
}

const updateGumtree = function(db, collection) {
	db[collection].update({notified: false}, {$set: {notified: true}}, {multi: true});
}

const queryGumtreeAndUpdate = queryDb('gumtree', {notified: false}, updateGumtree);

const createEmailContent = _.curry(function(ac, cv) {
	return ac += `${cv.title} - ${cv.price} - ${cv.link} - ${cv.location}\n\n`;
});

const createEmailJson = function(content) {
	const mailOptions = {
	    from: 'gumtree.scraper66@gmail.com', 
	    to: 'rory.kenyon01@gmail.com', 
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

const scheduleNotifications = initSchedule(_.compose(getGumtreeData, logMessage));

module.exports = scheduleNotifications;