const schedule = require('node-schedule'),
	_ = require('ramda'),
	nodemailer = require('nodemailer'),
	moment = require('moment'),
	db = require('./db.js'),
	{queryCallback} = require('./utils.js');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'gumtree.scraper66@gmail.com', 
        pass: 'gumtreeScraper123' 
    }
});

// Utils
// =================

const createEmailContent = _.curry(function(ac, cv) {
	return ac += `${cv.title} - ${cv.price} - ${cv.link} - ${cv.location}\n\n`
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

const createEmail = _.compose(createEmailJson, _.reduce(createEmailContent, ''))

const processEmail = _.compose(sendEmail(transporter), createEmail)

const processNotifications = _.compose(processEmail, queryCallback);

const scheduleNotifications = function(db) {
	schedule.scheduleJob('*/5 * * * *', function() {
		const time = moment().format('DD/MM/YY, h:mm:ss a');
		db.gumtree.find({notified: false}, processNotifications);
		db.gumtree.update({notified: false}, {$set: {notified: true}}, {multi: true});
		console.log(`check for notifications on ${time}`);
	});
} 

module.exports = scheduleNotifications;