const mongojs = require('mongojs');

const uri = 'mongodb://Roryk123:3com76@ds141078.mlab.com:41078/gumtree-scraper',
	db = mongojs(uri, ['gumtree', 'queries']);

module.exports = db;