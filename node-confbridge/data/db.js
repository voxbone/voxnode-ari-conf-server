'use strict';

var config = require('../config.json');
var util = require('util');
var sourceName = config.dbDriver;
var Source = require(util.format('./%s/source.js', sourceName));
var db = new Source(config);

module.exports = db;
