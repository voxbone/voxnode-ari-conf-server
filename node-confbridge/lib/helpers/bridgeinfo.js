'use strict';

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
};

BridgeInfo.getBridgeInfo = function (bridge_identifier) {
  return Q.Promise(function(resolve, reject, notify) {
    console.log("Nitesh -- Getting the bridge info for  ["+ bridge_identifier + "]");
    if (bridge_identifier !== undefined) {
      db.getConfBridgeProfile(bridge_identifier)
      .then(function processBridgeProfile(result) {
        if (result !== undefined) {
          console.log("Nitesh -- Bridge Info is "+ JSON.stringify(result));
          var bridge_info = new BridgeInfo();
          bridge_info.init(result)
          .then (function() {
            resolve(bridge_info);
          })
          .done();
        }
        else {
          console.log("Can't find any bridge profile for this identifier ["+ bridge_identifier + "]");
          reject(new Error('No bridge profile found'));
        }
      });
    } else {
      console.error("Received an invalid identifier");
      reject(new Error('Invalid Character given'));
    }
  })
}

BridgeInfo.prototype.init = function(result) {
  var self = this;
  return Q.Promise(function(resolve, reject, notify) {
    self.bridge_identifier = result['bridge_identifier'];
    self.remote_sip_uri = result['remote_sip_uri'];
    self.moh = Boolean(result['moh']);
    self.waiting_bridge = Boolean(result['waiting_bridge']);
    self.max_participants = result['max_participants'];
    self.pin_auth = Boolean(result['pin_auth']);
    self.bridge_passcode = result['bridge_passcode'];
    self.pin_retries = result['pin_tries'];
    self.participant_control = Boolean(result['participant_control']);
    self.admin_control = Boolean(result['admin_control']);

    var admin_profile_id = result['admin_prof_id'];
    var participant_ivr_profile_id = result['participant_prof_id'];

    if (self.participant_control === true && participant_ivr_profile_id !== undefined) {
      console.log("Nitesh -- getting the IVR profile for the participant");
      UserIvrInfo.getUserIvrInfo(participant_ivr_profile_id)
      .then(function setIvrProfile(user_ivr_profile) {
        console.log("Nitesh -- IVR profile retrieved");
        if (user_ivr_profile !== undefined) {
          self.participant_ivr_profile = user_ivr_profile;
        } else {
          self.participant_control = false;
        }

        if (self.admin_control === true && admin_profile_id !== undefined) {
          BridgeAdminInfo.getBridgeAdminInfo(admin_profile_id)
          .then(function setAdminProfile(admin_profile) {
            if (admin_profile !== undefined) {
              self.admin_profile = admin_profile;
            } else {
              self.admin_control = false;
            }
            resolve();
          }).catch(function(err) {
            console.error("couldn't get Admin stuff "+ err);
            reject(new Error('Couldnt get Admin info'));
          })
        }else{
          resolve();
        }
      })
      .catch(function(err) {
        console.error("couldn't get IVR stuff "+ err);
        reject(new Error('Couldnt get IVR info'));
      })
      .done();
    }
  });
};

module.exports = BridgeInfo;
