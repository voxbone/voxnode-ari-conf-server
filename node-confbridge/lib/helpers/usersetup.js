'use strict';

var Q = require('q');
var userFsm = require('./fsm/userfsm.js');
var util = require('util');

/**
 * This class keeps up with users that join the conference.
 *
 * @param {Object} ari - the ARI client
 * @param {Object} db - the database module
 * @param {Object} groups - the group setup module
 */
function UserSetup(ari, db, groups) {
  var self = this;

  /**
   * Contains all users that join the conference, where the index is the
   * channel id.
   */
  self.userList = {};

  /**
   * Cleanup handler for a channel.
   * @param {Object} channel - the channel leaving Stasis
   */
  this.channelCleanUp = function(channel) {
    if (self.userList[channel.id]) {
      var groupType = self.userList[channel.id].group.group_type;
      groups.removeFromGroup(groupType);
      if (groups.isFollower(self.userList, channel.id)) {
        groups.removeFollower(channel);
      }
      self.deleteUser(channel);
      self.unregisterEvents(channel);
    }
  }

  /**
   * Stores a user and their configuration in the users array.
   *
   * @param {Object} event - the event object
   * @param {Object} isOutboundChannel - is it outbound channel for customer media server
   * @param {Object} channel - the channel to add
   * @param {Object} bridge - the bridge the channel is entering
   */
  this.storeUser = function(event, isOutboundChannel, channel, bridge) {
	  var chanID = channel.id;
	  var userType = 'default';
	  var groupType = 'default';
	  if (event.args[0]) {
		  userType = event.args[0];
	  }
	  if (event.args[1]) {
		  groupType = event.args[1];
	  }
	  var userSettings = null;
	  var groupSettings = null;
	  db.getUserProfile(userType)
		  .then(function (result) {
				  userSettings = result;
				  return db.getGroupProfile(groupType);
				  })
	  .then(function (result) {
			  groupSettings = result;
			  })
	  .then(function () {
			  var fsm = userFsm(channel, ari, userSettings, isOutboundChannel, self.userList, bridge,
				  groups);
			  self.userList[chanID] = { channel: channel, settings: userSettings,
			  fsm: fsm, group: groupSettings, isOutboundChannel : isOutboundChannel };
			  if (groups.isFollower(self.userList, channel.id)) {
			  groups.addFollower(channel);
			  }
			  })
	  .then(function () {
                          console.log("Nitesh -- going to listen for events ");
			  self.registerEvents(channel);
			  })
	  .then(function () {
			  var group = self.userList[chanID].group.group_type;
        var groupMax = self.userList[chanID].group.max_members;
        if (groups.groupIsFull(group, groupMax)) {
          self.hangupChannel(channel, groupType);
        }
        else {
          groups.addToGroup(group);
          self.userList[chanID].fsm.handle('ready');
        }
      })
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };

  /**
   * Deletes a user from the users array.
   *
   * @param {Object} channel - the channel to delete
   */
  this.deleteUser = function(channel) {
    var chanID = channel.id;
    if (self.userList[chanID]) {
      delete(self.userList[chanID]);
    }
  };

  /**
   * Registers event listeners to the channel.
   *
   * @param {Object} channel - the channel to register events to
   */ 
  this.registerEvents = function(channel) {

    channel.on('StasisEnd', function (event, channel) {
      console.log("Nitesh -- Got the event "+ JSON.stringify(event));
      console.log("Channels in the userList "+ Object.keys(self.userList).length );
      self.channelCleanUp(channel);
    });

    channel.on('ChannelDtmfReceived', this.dtmfHandler);
 
    ari.channels.setChannelVar({channelId: channel.id, variable : {'TALK_DETECT(set)' : ''}},
                             function(err) {
                                 if(err) {
                         	   console.error('Nitesh -- failed to set channel var ', err);
                                 };
                             });
    channel.on('ChannelTalkingStarted', function (event, channel) {
      console.log("Channel is now talking ", channel.id);
    });
    channel.on('ChannelTalkingFinished', function (event, channel) {
      console.log("Channel is not talking anymore", channel.id);
    });

  };

  /**
   * Unregisters event listeners to the channel.
   *
   * @param {Object} channel - the channel to unregister events for
   */
  this.unregisterEvents = function(channel) {
    console.log("Nitesh -- Unregistering for DTMF events for channel "+ channel.id);
    channel.removeListener('ChannelDtmfReceived', this.dtmfHandler);
  };

  /**
   * Returns the list of users, indexed by channel id.
   *
   * @return {Object} userList - the list of users
   */
  this.getUsers = function() {
    return self.userList;
  };

  /**
   * The function to call when a DTMF is received.
   *
   * @param {Object} event - the DTMF event object
   */
  this.dtmfHandler = function(event) {
    console.log("Nitesh -- Got the DTMF "+ event.digit);
    self.userList[event.channel.id].fsm.handle('dtmf', { digit: event.digit });
  };

  /**
   * Called when a channel is considered done in the application.
   *
   * @param {Object} channel - the channel done with the application
   */
  this.handleDone = function(channel) {
    self.userList[channel.id].fsm.handle('done');
  };

  /**
   * Mark the channel as active, called when channel enters
   * the bridge.
   *
   * @param {Object} channel - the channel to be activated
   */
  this.activateChannel = function(channel) {
    var channelId = channel.id;
    if (self.userList[channelId] !== undefined) {
      self.userList[channelId].fsm.handle('activate');
    }
  };

  /**
   * Hangs up a given channel. Used for users that attempt to enter a group
   * that is aleady full.
   *
   * @param {Object} channel - the channel to hang up
   * @param {String} groupType - the group that is full
   */
  this.hangupChannel = function(channel, groupType) {
    var hangup = Q.denodeify(channel.hangup.bind(channel));
    hangup()
      .then(function() {
        console.log(util.format('Group \'%s\' is full', groupType));
      })
      .catch(function(err) {
        console.error(err);
      })
      .done();
  };

}

module.exports = UserSetup;
