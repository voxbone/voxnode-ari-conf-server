'use strict';

/**
TODO:
1. read the waiting input verify key, but downside is that
    you need to adapt the menu prompt as well
**/

var db = require('../../data/db.js');
var UserIvrInfo = require('./userivrinfo.js');
var BridgeAdminInfo = require('./bridgeadmininfo.js');
var Q = require('q');

function BridgeInfo() {
  this.bridge_identifier = undefined;
  this.remote_sip_uri = undefined;
  this.moh = false;
  this.waiting_bridge = false;
  this.max_participants = 10;
  this.pin_auth = false;
  this.bridge_passcode = undefined;
  this.pin_retries = 3;
  this.participant_control = false;
  this.admin_control = false;
  this.admin_profile = undefined;
  this.participant_ivr_profile = undefined;
  this.waiting_input_verify_key = '#';
  this.media_settings = undefined;
};

BridgeInfo.getBridgeInfo = function (bridge_identifier) {
  return Q.Promise(function(resolve, reject, notify) {
    console.log("Nitesh -- Getting the bridge info for  ["+ bridge_identifier + "]");
    var bridge_config = undefined;
    var media_settings = undefined;
    if (bridge_identifier !== undefined) {
      db.getConfBridgeProfile(bridge_identifier)
      .then(function processBridgeProfile(result) {
        if (result !== undefined) {
          bridge_config = result;
        }
        else {
          console.log("Can't find any bridge profile for this identifier ["+ bridge_identifier + "]");
          reject(new Error('No bridge profile found'));
        }
      })
      .then(function getBridgeMediaProfile() {
        return db.getBridgeProfile();
      })
      .then(function handleBridgeMediaProfile(result) {
        if (result !== undefined) {
          media_settings = result;
          var bridge_info = new BridgeInfo();
          bridge_info.init(bridge_config, media_settings)
          .then (function success() {
            resolve(bridge_info);
          })
          .done();
        } else {
          reject(new Error('bridge media profile not found'));
        }
      })
      .catch(function (err) {
        if(err) {
          console.error(err);
          reject(err);
        }
      })
      .done();
    } else {
      console.error("Received an invalid identifier");
      reject(new Error('Invalid Character given'));
    }
  })
}

BridgeInfo.prototype.init = function(bridge_config, media_settings) {
  var self = this;
  return Q.Promise(function(resolve, reject, notify) {
    self.bridge_identifier = bridge_config['bridge_identifier'];
    self.remote_sip_uri = bridge_config['remote_sip_uri'];
    self.moh = Boolean(bridge_config['moh']);
    self.waiting_bridge = Boolean(bridge_config['waiting_bridge']);
    self.max_participants = bridge_config['max_participants'];
    self.pin_auth = Boolean(bridge_config['pin_auth']);
    self.bridge_passcode = bridge_config['bridge_passcode'];
    self.pin_retries = bridge_config['pin_retries'];
    self.participant_control = Boolean(bridge_config['participant_control']);
    self.admin_control = Boolean(bridge_config['admin_control']);

    var admin_profile_id = bridge_config['admin_prof_id'];
    var participant_ivr_profile_id = bridge_config['participant_prof_id'];

    self.media_settings = media_settings;
    console.log("Nitesh -- Bridge Info is "+ JSON.stringify(bridge_config));
    console.log("Nitesh -- bridge media settings ", JSON.stringify(media_settings));

    self.initParticipantProfile(participant_ivr_profile_id)
    .then( function getAdminProfile(admin_profile_id) {
       self.initAdminProfile()
       .then( function() {
         resolve();
       })
       .done();
    });
  })
};

BridgeInfo.prototype.initParticipantProfile = function(participant_ivr_profile_id) {
  var self = this;
  return Q.Promise(function(resolve, reject, notify) {
    if (self.participant_control === true && participant_ivr_profile_id !== undefined) {
      UserIvrInfo.getUserIvrInfo(participant_ivr_profile_id)
      .then(function setIvrProfile(user_ivr_profile) {
        if (user_ivr_profile !== undefined) {
          self.participant_ivr_profile = user_ivr_profile;
        } else {
          self.participant_control = false;
        }
        resolve();
      })
      .done();
    } else {
      self.participant_control = false;
      console.log("Participant control not enabled for this bridge");
      resolve();
    }
  })
};

BridgeInfo.prototype.initAdminProfile = function(admin_profile_id) {
  var self = this;
  return Q.Promise(function(resolve, reject, notify) {
    if (self.admin_control === true && admin_profile_id !== undefined) {
      UserIvrInfo.getUserIvrInfo(participant_ivr_profile_id)
      .then(function setIvrProfile(user_ivr_profile) {
        if (user_ivr_profile !== undefined) {
          self.participant_ivr_profile = user_ivr_profile;
        } else {
          self.participant_control = false;
        }
        resolve();
      })
      .done();
    } else {
      self.admin_control = false;
      console.log("Admin control not enabled for this bridge");
      resolve();
    }
  })
};

module.exports = BridgeInfo;
