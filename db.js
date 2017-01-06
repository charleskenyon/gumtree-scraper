const mongojs = require('mongojs');

var uri;

if (process.argv[2] === 'test') {
	uri = 'mongodb://Roryk123:3com76@ds157258.mlab.com:57258/gumtree-scraper-test';
} else {
	uri = 'mongodb://Roryk123:3com76@ds141078.mlab.com:41078/gumtree-scraper';
}

const db = mongojs(uri, ['gumtree', 'queries']);

module.exports = db;