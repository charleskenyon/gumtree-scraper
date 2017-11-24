const mongojs = require('mongojs');
const uriCredentials = require('./credentials').mongo.uri;

const uri = process.argv[2] === 'dev' ? uriCredentials.dev : uriCredentials.production;
const db = mongojs(uri, ['gumtree', 'queries']);

module.exports = db;