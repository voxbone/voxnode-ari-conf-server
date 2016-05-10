Q = require('q');

module.exports = {

  /**
   * Answers the channel.
   *
   * @param {Object} ari - the ARI client
   * @param {Object} channel - the channel id
   */
  answerChannel : function(ari, channelId) {
    console.log("answering the channel");
    var answer = Q.denodeify(ari.channels.answer.bind(ari));
    return answer({channelId: channelId})
      .catch(function(err) {
        console.error(err);
      });
  },

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
    console.log("Nitesh -- destroying the bridge "+ bridgeId);
    var shutdown = Q.denodeify(ari.bridges.destroy.bind(ari));
    return shutdown({bridgeId: bridgeId})
      .catch(function(err) {
        console.error(err);
      });
  },

}
