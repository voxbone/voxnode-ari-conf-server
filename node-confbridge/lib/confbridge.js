'use-strict';
var db = require('../data/db.js');

var VoxBridgeManager = require('./helpers/voxbridgemanager.js');

/**
 * ConfBridge constructor.
 *
 * @param {ari-client~Client} ari - ARI client
 */
function ConfBridge(ari) {
  var self = this;

  // Sets up the driver class to initialize the conference.
  var voxBridgeManager = new VoxBridgeManager(ari, db);

  /**
   * Handles StasisStart event to initialize bridge.
   *
   * @param {Object} event - the event object
   * @param {ari-client~Channel} incoming - the channel entering Stasis
   */
  this.start = function(event, channel) {
        console.log("Nitesh -- Got the event "+ JSON.stringify(event));
  	voxBridgeManager.handleChannel(event, channel);
  };

  ari.on('StasisStart', self.start);
}

module.exports = ConfBridge;
