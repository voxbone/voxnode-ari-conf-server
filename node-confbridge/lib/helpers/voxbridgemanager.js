'use strict';

var ChannelDriver = require('./channeldriver.js');
var VoxConfBridge = require('./voxconfbridge.js');
var BridgeInfo = require('./bridgeinfo.js');

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
      var conf_bridge = undefined;
      var exten = event.args[0];

      conf_bridge  = self.findBridge(exten);
      if(conf_bridge !== undefined) { 
        console.log("Incoming channel with extension [" + exten + "] maps to the bridge ["+ conf_bridge.bridge.id + "]");
        conf_bridge.registerUser(event, false, channel);
      } else {
        console.log("Can't find any existing bridge for this extension [" + exten + "]");
        BridgeInfo.getBridgeInfo(exten)
        .then(function processBridgeInfo(bridge_info) {
          console.log("Nitesh -- bridge info is back, yay");
          if (bridge_info !== undefined) {
            conf_bridge = new VoxConfBridge(ari);
            conf_bridge.init(bridge_info);

            /**Add the bridge to the bridgeList**/
            bridgeList[conf_bridge.bridge.id] = conf_bridge;
            console.log("Bridge ID to register is "+ conf_bridge.bridge.id);

            self.registerEvents(conf_bridge.bridge);
            conf_bridge.registerUser(event, false, channel);
          } else {
            console.log("Unknown extension [" + exten + "] blocking it");
            ChannelDriver.blockChannel(ari, channel.id);
          }
        });
      }
    }
    else {
      if (event.args.length !== 2) {
          console.error("Should have received two arguments, received args "+ event.args);
          ChannelDriver.hangupChannel(ari, channel.id);
      } else {
        var bridgeExten = event.args[1];
        var bridge = self.findBridge(bridgeExten);
        if (bridge !== undefined) {
          bridge.registerUser(event, true, channel);
        } else {
          console.error("Couldn't find any bridge for this identifier "+ bridgeExten);
          ChannelDriver.hangupChannel(ari, channel.id);
        }
      }
    }

  };

  /**
   * Register events on a bridge.
   * @param {Object} bridge - Bridge object
   */
  this.registerEvents = function(bridge) {
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
    var bridgeId = bridge.id;
    if (bridgeList[bridgeId] !== undefined) {
      console.log("Nitesh -- Deleting the bridge object from list " + bridgeId );
      delete bridgeList[bridgeId];
    }
  };

  /**
   * find if there is an exisiting bridge for this
   * extension.
   * @param {String} exten - Stasis channel extension
   *
   * @return {Object} bridge - Bridge object in case the channel
   *                           can be added to an existing bridge,
   *                           undefined otherwise  
   */
  this.findBridge = function(exten) {
       var ret  = undefined;
       console.log("Nitesh -- finding the bridge for exten "+ exten);
       for (var id in bridgeList) {
         var conf_bridge = bridgeList[id];
         if (conf_bridge.bridge.config.bridge_identifier === exten && !conf_bridge.isInactive()) {
           ret = conf_bridge;
           break;
         }
       }
       return ret;
  }

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
