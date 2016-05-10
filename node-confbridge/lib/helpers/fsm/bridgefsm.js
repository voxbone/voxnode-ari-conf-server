'use strict';

var machina = require('machina');
var util = require('util');
var uuid = require('node-uuid');
var Q = require('q');
var BridgeDriverModule = require('./modules/bridgedriver.js');
var ChannelMediaModule = require('./modules/channelmedia.js');
var RecordingDriverModule = require('./modules/recordingdriver.js');
var ChannelDriver = require('../channeldriver.js');

/**
TODO:
1. don't call stiopMoh on all channels, check if we
are actually playing moh on the channel
**/
/**
 * Creates an fsm for a bridge and returns it.
 *
 * @returns fsm - the fsm to return
**/

function createFsm(ari, bridge, users) {

  var bridgeDriver = new BridgeDriverModule();
  var channelMedia = new ChannelMediaModule();
  var recordingDriver = new RecordingDriverModule();

  var fsm = new machina.Fsm({

    initialState: 'empty',

    printState: function() {
      console.log('Bridge transitioned from ' + this.priorState + ' to  the state ' + this.state);
      console.log('Bridge entered the state', this.state);
    },

    bridgeStartMoh : function() {
      console.log('Nitesh -- Playing Moh', this.state);
      var userList = users.getUsers();
      for (var chanId in userList) {
        var channel = userList[chanId];
        if (bridge.config.moh && channel.fsm.isActive()
             && channel.isOutboundChannel === false) {
           channelMedia.startMoh(ari, chanId);
        }
      }
    },

    bridgeStopMoh : function() {
      console.log('Nitesh -- Stopping Moh', this.state);
      var userList = users.getUsers();
      for (var chanId in userList) {
        var channel = userList[chanId];
        if (bridge.config.moh && channel.fsm.isActive()
             && channel.isOutboundChannel === false) {
           channelMedia.stopMoh(ari, chanId);
        }
      }
    },

    states: {

      // The state where no channels are in the bridge.
      'empty': {
        _onEnter: function() {
          this.printState();
          bridgeDriver.setToDefault(bridge);
        },

        'userJoin': function(data) {
          this.transition('single');
          console.log("Nitesh -- Bridge MoH setting  "+ bridge.config.moh);
          var userList = users.getUsers();

          var recordingName = util.format('confbridge-rec %s', uuid.v4());
          bridge.currentRecording = ari.LiveRecording({name: recordingName});
          if (bridge.config.media_settings.record_conference) {
            var record = Q.denodeify(bridge.record.bind(bridge));
            recordingDriver.startRecording(bridge)
              .then(function () {
                var userList = users.getUsers();
                for (var chanId in userList) {
                  channelMedia.announceRecording(ari, chanId, bridge);
                }
              })
              .catch(function (err) {
                console.error(err);
              })
              .done();
          }
		
          if(bridge.config.remote_sip_uri != null) {
            /*Invite the customer media server in the call*/
            bridgeDriver.inviteRemoteToBridge(ari, bridge);
          }
        },

      },


      // The state where only a single user is in the bridge.
      'single': {
        _onEnter: function() {
          this.printState();
          if (this.priorState !== 'singleWithMediaServer')
          {
            this.bridgeStartMoh();
          }
        },

        'userJoin': function(data) {
          var userList = users.getUsers();
          if (userList[data.channelId].isOutboundChannel === true) {
            this.transition('singleWithMediaServer');
          } else {
            channelMedia.announceRecording(ari, data.channelId, bridge);
            this.transition('multi');
          }
        },

        'userExit': function() {
          this.transition('empty');
          console.log("Bridge transitioned to empty state, well time to delete the bridge then");
          bridge.inactive = true;
          ChannelDriver.shutdownBridge(ari, bridge.id);
        },

      },


      /*A state representing when there are two participants in
        conference, but one of the them is the customer's media
        server */
      'singleWithMediaServer': {
        _onEnter: function() {
          this.printState();
          if (this.priorState === 'multi') {
            this.bridgeStartMoh();
          }
          
        },

        'userJoin': function(data) {
          this.transition('multi');
          channelMedia.announceRecording(ari, data.channelId, bridge);
        },

        'userExit': function(data) {
          var userList = users.getUsers();
          var channelId = data.confBridge.channels[0];
          if (userList[channelId] !== undefined) {
            if (userList[channelId].isOutboundChannel === true) {
              console.log("Nitesh -- only outbound channel left");
              ChannelDriver.hangupChannel(ari, channelId);
            }
          }
          this.transition('single');
          
        }

      },


      // The state when multiple users are in the bridge.
      'multi': {
        _onEnter: function() {
          this.printState();
          if (this.priorState === 'single' || this.priorState === 'singleWithMediaServer') {
            this.bridgeStopMoh();
          }
        },

        'userJoin': function(data) {
          channelMedia.announceRecording(ari, data.channelId, bridge);
        },

        'userExit': function(data) {
          var num_channels_left = data.confBridge.channels.length;

          if (num_channels_left === 2)
          {
             var userList = users.getUsers();
             var single_active_channel = false;
             for (var chanId in userList) {
               if (userList[chanId].isOutboundChannel === true) {
                 /**there is only one active channel in the 
                  *bridge, other channel is the media server **/
                 single_active_channel = true;
               }
             }
             if (single_active_channel === true) {
               this.transition('singleWithMediaServer');
             }
          } else if (num_channels_left === 1) { 
            this.transition('single');
          }

        },
      }

    }

  });

  return fsm;
}

module.exports = createFsm;
