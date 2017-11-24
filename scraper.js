const request = require('request');
const cheerio = require('cheerio');
const _ = require('ramda');
const moment = require('moment');
const db = require('./db.js');

const trace = _.tap(x => console.log(x));

// utils
// =================
 
const url = function(query, location) {
	return `https://www.gumtree.com/search?q=${query}&search_location=${location}`;
}

const requestUrl = function(url) {
	return new Promise((resolve, reject) => {
		request(url, (error, response, body) => {
			if (!error) resolve(body);
		});
	});
}

const updataDb = _.curry(function(db, doc) {
	const now = moment().format('MMMM Do YYYY, h:mm:ss a');

	db.gumtree.update(
		{ "_id": doc["_id"] }, 
		{
			"$set": Object.assign(doc, {last_update_date: now}), 
			"$setOnInsert": {
				"insertion_date": now,
				"notified": false
			}
		}, 
		{ upsert: true }
	);
});

const getItems = ($) => $('.list-listing-mini .natural');

const convertToArray = (obj) => Array.prototype.slice.call(obj);

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

const processResponse = _.composeP(cheerio.load, requestUrl);

const items = _.composeP(processData, processResponse);

const getAndUpdateData = _.composeP(_.forEach(updataDb(db)), items);

const scraper = _.compose(getAndUpdateData, url);

module.exports = scraper;