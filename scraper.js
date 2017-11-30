const request = require('request');
const cheerio = require('cheerio');
const _ = require('ramda');
const moment = require('moment');
const { evolveP } = require('./utils.js');
const db = require('./db.js');

// utils
// =================
 
const parseObj = function(query, location, email) {
	return {
		data: `https://www.gumtree.com/search?q=${query}&search_location=${location}`,
		email: email
	} 
}

const requestUrl = function(url) {
	return new Promise((resolve, reject) => {
		request(url, (error, response, body) => {
			if (!error) resolve(body);
		});
	});
}

const getItems = ($) => $('.list-listing-mini .natural');

const convertToArray = (obj) => Array.prototype.slice.call(obj);

const scrapeData = function($) {
	const data = {
		title: $('.listing-title').text().replace(/[^a-zA-Z0-9_ ]/g, ""),
		price: $('.listing-price').text(),
		location: $('.listing-location .truncate-line').text().replace(/[^a-zA-Z0-9_ ]/g, ""),
		_id: $('article').attr('data-q').split('-')[1],
		link: 'https://www.gumtree.com' + $('.listing-link').attr('href')
	};

	Object.keys(data).forEach((key) => {
		data[key] = data[key].replace(/\r?\n|\r/g, ""); // remove newlines
	});

	return data;
}

const updataDb = _.curry(function(db, obj) {
	const now = moment().format('MMMM Do YYYY, h:mm:ss a');

	obj['data'].forEach((doc) => {
		db.gumtree.update(
			{ "_id": doc["_id"] }, 
			{
				"$set": Object.assign(doc, {last_update_date: now}), 
				"$setOnInsert": {
					"insertion_date": now,
					"notified": false
				},
				$addToSet: {
					email: obj.email
				}
			}, 
			{ upsert: true }
		);
	});
});

// =================

const processEntry = _.compose(scrapeData, cheerio.load);

const processData = _.compose(_.map(processEntry), convertToArray, getItems);

const gumtreeRequest = _.composeP(cheerio.load, requestUrl);

const items = _.composeP(processData, gumtreeRequest);

const parseDataUpdateDb = _.composeP(updataDb(db), evolveP({data: items}));

const scraper = _.compose(parseDataUpdateDb, parseObj);

module.exports = scraper;