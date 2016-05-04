'use strict';
var bridgeInfo = require('./lib/helpers/bridgeinfo');

bridgeInfo.getBridgeInfo(10000)
.then(function (result) {
  console.log('RESULT', result);
})
.catch(function (err) {
  console.log('ERR', err)
})
