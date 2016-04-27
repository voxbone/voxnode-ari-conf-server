'use strict';

var ChannelDriver = require('./channeldriver.js');
var VoxConfBridge = require('./voxconfbridge.js');

/**
 * This class keeps up with all the bridges managed by the ARI client.
 *
 * @param {Object} ari - the ARI client
 * @param {Object} db - the database module
 *
 */
function VoxBridgeManager(ari, db) {

  var self = this;
  /**
   * Contains the list of the all bridges managed by the ARI client
   * bridge_identifier field in DB will serve as the key for bridges
   */
  var bridgeList = {};

  /**
   * Handler for channels entering the Stasis app.
   * @param {Object} event - StasisEvent
   * @param {Object} channel - the channel entering the Stasis app
   */
  this.handleChannel = function(event, channel) {
    var outbound = event.args[0] === 'outbound';
    if (!outbound) {
      var confBridge = undefined;
      var exten = event.args[0];
      var confBridgeProfile = undefined;
      db.getConfBridgeProfile(exten)
	     .then(function (result) {
               console.log("bridge profile is "+ JSON.stringify(result));
               confBridgeProfile = result;
              })
      .then( function() {
        if (confBridgeProfile === undefined) {
          console.log("Unknown extension [" + exten + "] blocking it");
          ChannelDriver.blockChannel(ari, channel.id);
        } else { 
          console.log("This is a known extension, we should handle it");
          channel.answer(function (err) {
            /** check there is already a bridge for this extension **/ 
            confBridge  = bridgeList[exten];
            if(confBridge !== undefined) { 
              console.log("We already have a bridge for this extension, so just use it");
              confBridge.registerUser(event, false, channel);
            } else {
              console.log("Can't find any existing bridge for this extension");
              confBridge = new VoxConfBridge(ari);
              confBridge.init(confBridgeProfile['bridge_identifier'], confBridgeProfile['remote_sip_uri']);
              /**Add the bridge to the bridgeList**/
              bridgeList[exten] = confBridge;
              console.log("Bridge ID to register is "+ confBridge.bridge.id);
              self.registerEvent(confBridge.bridge);
              confBridge.registerUser(event, false, channel);
            }
          
          });
        }
      })
      .done();
    }
    else {
      if (event.args.length !== 2) {
          console.error("Should have received two arguments, received args "+ event.args);
          ChannelDriver.hangupChannel(ari, channel.id);
      } else {
        var bridgeIdentifier = event.args[1];
        var bridge = bridgeList[bridgeIdentifier];
        if (bridge !== undefined) {
          bridge.registerUser(event, true, channel);
        } else {
          console.error("Couldn't find any bridge for this identifier "+ bridgeIdentifier);
          ChannelDriver.hangupChannel(ari, channel.id);
        }
      }
    }

  };

  /**
   * Register events on a bridge.
   * @param {Object} bridge - Bridge object
   */
  this.registerEvent = function(bridge) {
    bridge.on('BridgeDestroyed', function (event, bridge) {
      self.handleBridgeDestroyed(event,bridge);
    });
  };

  /**
   * Handler for BridgeDestroyed StasisEvent.
   * @param {Object} event - the StasisEnd event
   * @param {Object} bridge - Bridge object
   */
  this.handleBridgeDestroyed = function(event,bridge) {
    console.log("Nitesh -- Received the event "+ JSON.stringify(event));
    var bridgeIdentifier;
    for (var key in bridgeList) {
      var obj = bridgeList[key];
      if(obj.bridge.id === bridge.id) {
        bridgeIdentifier = key;
      }
    }
    if (bridgeIdentifier !== undefined) {
      console.log("Nitesh -- Deleting the bdge object from list " + bridgeIdentifier );
      delete bridgeList[bridgeIdentifier];
    }
  };

  /**
   * Returns the list of bridges, indexed by bridge id.
   *
   * @return {Object} bridgeList - the list of bridge
   */
  this.getBridges = function() {
    return bridgeList;
  };
}

module.exports = VoxBridgeManager;
