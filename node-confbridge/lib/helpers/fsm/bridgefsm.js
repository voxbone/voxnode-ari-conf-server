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
 * Creates an fsm for a bridge and returns it.
 *
 * @returns fsm - the fsm to return
 */
function createFsm(ari, bridge, users) {

  var bridgeDriver = new BridgeDriverModule();
  var channelMedia = new ChannelMediaModule();
  var recordingDriver = new RecordingDriverModule();

  var fsm = new machina.Fsm({

    initialState: 'empty',

    printState: function() {
      console.log('Bridge entered state', this.state);
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
          bridgeDriver.inviteRemoteToBridge(ari, bridge);
        },

        _onExit: function() {
          var recordingName = util.format('confbridge-rec %s', uuid.v4());
          bridge.currentRecording = ari.LiveRecording({name: recordingName});
          if (bridge.settings.record_conference) {
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
        }
      },

      // The state where only a single user is in the bridge.
      'single': {
        _onEnter: function() {
          this.printState();
          var userList = users.getUsers();
          console.log("Nitesh[bridgefsm] -- New channel in the bridge  "+ bridge.id);
          for (var chanId in userList) {
            console.log("Nitesh -- Channel in the list is  "+ chanId);
            console.log("Nitesh -- Channel inactive  "+ userList[chanId].fsm.isInactive());
            console.log("Nitesh -- Channel moh setting  "+ userList[chanId].settings.moh);
            if (!userList[chanId].fsm.isInactive() && userList[chanId].settings.moh) {
              console.log("Nitesh -- playing music on hold here  ");
              channelMedia.startMoh(ari, chanId);
            }
          }  
        },

        _onExit: function() {
          var userList = users.getUsers();
          for (var chanId in userList) {
            if (userList[chanId].settings.moh &&
                userList[chanId].fsm.isActive()) {
              channelMedia.stopMoh(ari, chanId);
            }
          }
        },

        'userJoin': function(data) {
          this.transition('multi');
          channelMedia.announceRecording(ari, data.channelId, bridge);
        },

        'userExit': function() {
          this.transition('empty');
          console.log("Bridge transitioned to empty state, well time to delete the bridge then");
          ChannelDriver.shutdownBridge(ari, bridge.id);
        }
      },

      // The state when multiple users are in the bridge.
      'multi': {
        _onEnter: function() {
          this.printState();
          /***Nitesh
          var playMusicOnHold = false;
          var userList = users.getUsers();
          var numChannelsInBridge = Object.keys(userList).length;
          if (numChannelsInBridge === 2) {
            for (var chanId in userList) {
              if (userList[chanId].isOutboundChannel === true) {
                console.log("Out of the two channels in the bridge, one of the channel is outbound, so play bridge moh");
                playMusicOnHold = true;
              }
            }
          }
          if (playMusicOnHold === true) {            
            ChannelDriver.bridgeStartMoh(ari, bridge.id);
            bridge.playingMoh = true;
          }**/
          
        },

        'userJoin': function(data) {
          /***Nitesh
          if (bridge.playingMoh === true) {
            ChannelDriver.bridgeStopMoh(ari, bridge.id);
          }***/
          channelMedia.announceRecording(ari, data.channelId, bridge);
        },

        'userExit': function(data) {
          if (data.confBridge.channels.length === 1 &&
              data.confBridge.id === bridge.id) {
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
        }
      }
    }

  });

  return fsm;
}

module.exports = createFsm;
