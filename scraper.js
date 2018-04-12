const _ = require('ramda');
const { task, waitAll } = require('folktale/concurrency/task');
const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const { chain, evolveTask, updateDb } = require('./utils');
const db = require('./db');

// =================
 
const formatObj = function(query, location, email) {
	return {
		data: `https://www.gumtree.com/search?q=${query}&search_location=${location}`,
		email: email
	}
}

const requestUrl = function(url) {
	return task((resolver) => {
		request(url, (err, res, body) => {
			if (!err) resolver.resolve(body);
		});
	});
}

const getItems = ($) => $('.list-listing-mini .natural');

const scrapeData = ($) => ({
	title: $('.listing-title').text().replace(/\r?\n|\r/g, ''),
	price: $('.listing-price').text().replace(/\r?\n|\r/g, ''),
	location: $('.listing-location .truncate-line').text().replace(/\r?\n|\r/g, ''),
	_id: $('article').attr('data-q').split('-')[1].replace(/\r?\n|\r/g, ''),
	link: 'https://www.gumtree.com' + $('.listing-link').attr('href').replace(/\r?\n|\r/g, '')
});

const zipEmail = function(obj) {
	return _.converge(
		(data, email) => _.map(_.assoc('email', email), data),
		[
			_.prop('data'),
			_.prop('email')
		]
	)(obj);
}

const updateEntry = _.curry(function(db, data) {
	const now = moment().format('MMMM Do YYYY, h:mm:ss a');
	return updateDb(
		'gumtree',
		{ 
			'_id': data['_id'],
			'recipients.email': { $ne: data.email }
		},
		{
			'$set': _.dissoc('email', data), 
			'$setOnInsert': {
				"insertion_date": now
			},
			$addToSet: {
				recipients: {
					email: data.email,
					notified: false
				}
			}
		},
		db
	);
});

// =================

const formatEntry = _.compose(scrapeData, cheerio.load);

const formatData = _.compose(_.map(formatEntry), Array.from, getItems, cheerio.load);

const gumtreeData = _.compose(_.map(formatData), requestUrl);

const updateGumtreeData = _.compose((data) => waitAll(_.map(updateEntry(db), data)), zipEmail);

const formatDataUpdateDb = _.compose(chain(updateGumtreeData), evolveTask({ data: gumtreeData }));

const scraper = _.compose(formatDataUpdateDb, formatObj);

module.exports = scraper;