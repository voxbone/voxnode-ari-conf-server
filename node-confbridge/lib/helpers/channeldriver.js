var Q = require('q');

module.exports = {

  /**
   * Hangs up a channel.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} channel - the channel id
   */
  hangupChannel : function(ari, channelId) {
    var remove = Q.denodeify(ari.channels.hangup.bind(ari));
    return remove({channelId: channelId})
      .catch(function(err) {
        if(err) {
          console.error("hangupChannel failed");
          console.error(err);
        }
      });
  },

  /**
   * Sends the channel to block context.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} channel - the channel id
   */
  blockChannel : function(ari, channelId) {
    var block = Q.denodeify(ari.channels.continueInDialplan.bind(ari));
    return block({channelId: channelId, context : 'block', extension : 's'})
      .catch(function(err) {
        console.error(err);
      });
  },

  /**
   * Shutdown the bridge.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} bridgeID - ID of the bridge to be destroye
   */
  shutdownBridge : function(ari, bridgeId) {
    console.log("Nitesh -- destorying the bridge "+ bridgeId);
    var shutdown = Q.denodeify(ari.bridges.destroy.bind(ari));
    return shutdown({bridgeId: bridgeId})
      .catch(function(err) {
        console.error(err);
      });
  },

  /**
   * Start musicOnHold on the bridge.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} bridgeID - ID of the bridge
   */
  bridgeStartMoh : function(ari, bridgeId) {
    var startMoh = Q.denodeify(ari.bridges.startMoh.bind(ari));
    console.log("Nitesh -- start musicOnHold for the bridge "+ bridgeId);
    return startMoh({bridgeId: bridgeId})
      .catch(function(err) {
        if(err) {
	  console.error("startMoh failed on the bridge ");
          console.error(err);
        }
      });
  },
  
  /**
   * Stop musicOnHold on the bridge.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} bridgeID - ID of the bridge
   */
  bridgeStopMoh : function(ari, bridgeId) {
    var stopMoh = Q.denodeify(ari.bridges.stopMoh.bind(ari));
    return stopMoh({bridgeId: bridgeId})
      .catch(function(err) {
        if(err) {
          console.error("stopMoh failed on the bridge ");
          console.error(err);
        }
      });
  },
}
