const request = require('request'),
	cheerio = require('cheerio'),
	_ = require('ramda'),
	moment = require('moment'),
	db = require('./db.js');

const trace = _.curry(function(x) {
	console.log(x);
	return x;
});

// utils
// =================
 
const url = function(query, location) {
	return `https://www.gumtree.com/search?q=${query}&search_location=${location}`;
}

const requestUrl = _.curry(function(callback, url) {
	request(url, callback);
});

const updataDb = _.curry(function(db, doc) {
	const now = moment().format('MMMM Do YYYY, h:mm:ss a');

	db.gumtree.update(
		{"_id": doc["_id"]}, 
		{
			"$set": Object.assign(doc, {last_update_date: now}), 
			"$setOnInsert": {
				"insertion_date": now,
				"notified": false
			}
		}, 
		{upsert: true}
	);
});

const processResponse = function(error, response, body) {
	if (!error) return body;
}

const getItems = function($) {
	return $('.list-listing-mini .natural');
}

const convertToArray = function(obj) {
	return Array.prototype.slice.call(obj);
}

const scrapeData = function(html) {
	const $ = cheerio.load(html);
	const data = {};
	data['title'] = $('.listing-title').text().replace(/[^a-zA-Z0-9_ ]/g, "");
	data['price'] = $('.listing-price').text();
	data['location'] = $('.listing-location .truncate-line').text().replace(/[^a-zA-Z0-9_ ]/g, "");
	data['_id'] = $('article').attr('data-q').split('-')[1];
	data['link'] = 'https://www.gumtree.com' + $('.listing-link').attr('href');
	return data;
}

// =================

const processData = _.compose(_.map(scrapeData), convertToArray, getItems);

const toCheerio = _.compose(cheerio.load, processResponse);

const items = _.compose(processData, toCheerio);

const getData = _.compose(_.forEach(updataDb(db)), items);

const scraper = _.compose(requestUrl(getData), url);

module.exports = scraper;