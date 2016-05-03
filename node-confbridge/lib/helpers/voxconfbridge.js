'use strict';

var Q = require('q');
var util = require('util');
var db = require('../../data/db.js');
var UserSetup = require('./usersetup.js');
var bridgeFsm = require('./fsm/bridgefsm.js');
var GroupSetup = require('./groupsetup.js');

function VoxConfBridge(ari) {
  var self = this;

  self.bridge = ari.Bridge();
  console.log("Bridge ID is "+self.bridge.id)
  var groups = new GroupSetup();
  self.users = new UserSetup(ari, db, groups);

  /**
   * Sets up the bridge for the conference.
   */
  this.init = function(bridge_info) {
    self.bridge.config = bridge_info;
    var createBridge = Q.denodeify(self.bridge.create.bind(self.bridge));
    createBridge({type: 'mixing,dtmf_events'})
      .then(function () {
        self.setBridgeDefaults();
        self.registerEvents(self.bridge);
      })
      .then(function () {
        return db.getBridgeProfile();
      })
      .then(function (result) {
        self.bridge.settings = result;
      })
      .then(function () {
        self.bridge.fsm = bridgeFsm(ari, self.bridge, self.users);
      })
      .catch(function (err) {
        console.error(err);
      })
      .done();
  };

  /**
   * Stores the user and creates a finite state machine for them.
   *
   * @param {Object} event - the StasisStart event
   * @param {Object} isOutboundChannel - is it outbound channel for customer media server
   * @param {Object} channel - the channel to store
   */
  this.registerUser = function(event, isOutboundChannel, channel) {
    console.log("Nitesh -- Adding channel ["+ channel.id +"] to the userList for bridge [" + self.bridge.id + "]");
    self.users.storeUser(event, isOutboundChannel, channel, self.bridge);
  };

  /**
   * Registers event listeners to the bridge.
   *
   * @param {Object} bridge - the bridge to register events to
   */
  this.registerEvents = function(bridge) {
    bridge.on('ChannelEnteredBridge', function (event, instances) {
      console.log("Nitesh -- Got the event "+ JSON.stringify(event));
      self.bridgeEnterHandleBridge(instances);
      self.bridgeEnterHandleGroups(instances);
      self.bridgeEnterHandleUsers(instances);
    });
    bridge.on('ChannelLeftBridge', function (event, instances) {
      console.log("Nitesh -- Got the event "+ JSON.stringify(event));
      self.bridgeLeaveHandleBridge(instances);
      self.bridgeLeaveHandleGroups(instances);
      self.bridgeLeaveHandleUsers(instances);
    });
  };

  /**
   * Returns the size of the object.
   *
   * @param {Object} obj - the object to get the size of
   * @return {Integer} size - the size of the object
   */
  this.size = function(obj) {
    return Object.keys(obj).length;
  };

  /**
   * Initializes some default variables needed for the bridge.
   */
  this.setBridgeDefaults = function() {
    self.bridge.lastJoined = [];
    self.bridge.inactive = false;
    self.bridge.channels = [];
    self.bridge.recordingEnabled = false;
    self.bridge.recordingPaused = true;
    self.bridge.playingMoh = false;
    self.bridge.locked = false;
    self.bridge.muted = false;
  };

  /**
   * Returns true if bridge is inactive, false otherwise.
   *
   * @return {boolean} true/false
   */
  this.isInactive = function() {
    if(self.bridge.inactive === true) {
      console.log("this bridge ID [" + self.bridge.id + "] is inactive");
      return true;
    } else {
      console.log("Nitesh-- bridge is active");
      return false;
    }
  };

  /**
   * Handles bridge related events when a user enters the bridge.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeEnterHandleBridge = function(instances) {
    var channelId = instances.channel.id;
    self.users.activateChannel(instances.channel);
    console.log("Nitesh -- Channel ID added to the bridge is "+ channelId);
    self.bridge.lastJoined.push(channelId);
    self.bridge.channels[channelId] = instances.channel;
    console.log("Nitesh -- bridge state is "+ self.bridge.fsm.state);
    self.bridge.fsm.handle('userJoin', {channelId: instances.channel.id});
  };

  /**
   * Handles group related events when a user enters the bridge.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeEnterHandleGroups = function(instances) {
    var channelId = instances.channel.id;
    var userList = self.users.getUsers();
    if (groups.isLeader(userList,channelId)) {

      groups.addLeader(instances.channel);
      var followers = groups.getFollowers();
      for (var chanId in followers) {
        userList[chanId].fsm.handle('leaderJoined');
      }

    }
  };

  /**
   * Handles user related events when a user enters the bridge.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeEnterHandleUsers = function(instances) {
    var userList = self.users.getUsers();
    for (var chanId in userList) {

      if (!userList[chanId].settings.quiet &&
          !groups.isFollower(userList,chanId)) {

        var soundToPlay = util.format('sound:%s', self.bridge.settings.join_sound);
        var play = Q.denodeify(ari.channels.play.bind(ari));
        play({channelId: chanId, media: soundToPlay})
          .catch(function (err) {
            console.error(err);
          })
          .done();

      }

    }
  };

  /**
   * Handles bridge related events when a user leaves the bridge, and also
   * places the user in an inactive state.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeLeaveHandleBridge = function(instances) {
    console.log("Nitesh -- channel " + instances.channel.id + " left the bridge");
    var channelId = instances.channel.id;
    delete self.bridge.channels[channelId];

    var userList = self.users.getUsers();
    if (!groups.isFollower(userList,channelId)) {
      self.users.handleDone(instances.channel);
    }

    self.bridge.fsm.handle('userExit', {confBridge: instances.bridge});
    self.bridge.lastJoined = self.bridge.lastJoined.filter(function(candidate) {
      return candidate !== channelId;
    });
  };

  /**
   * Handles group related events when a user leaves the bridge.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeLeaveHandleGroups = function(instances) {
    var channelId = instances.channel.id;
    var userList = self.users.getUsers();
    if (groups.isLeader(userList,channelId)) {

      groups.removeLeader(instances.channel);
      if (!groups.containsLeaders()) {

        var followers = groups.getFollowers();
        for (var chanId in followers) {
          userList[chanId].fsm.handle('noLeaders');
        }

      }

    }
  };

  /**
   * Handles user related events when a user leaves the bridge.
   *
   * @param {Object} instances - contains objects related to the event
   */
  this.bridgeLeaveHandleUsers = function(instances) {
    var userList = self.users.getUsers();
    for (var chanId in userList) {

      if (!userList[chanId].settings.quiet &&
          userList[chanId].fsm.isActive() &&
          !groups.isFollower(userList,chanId)) {

        var soundToPlay = util.format('sound:%s',
                                      self.bridge.settings.leave_sound);
        var play = Q.denodeify(ari.channels.play.bind(ari));
        play({channelId: chanId, media: soundToPlay})
          .catch(function (err) {
            console.error(err);
          })
          .done();

      }

    }
  };

}

module.exports = VoxConfBridge;
