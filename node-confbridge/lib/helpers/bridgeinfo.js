'use strict';

var db = require('../../data/db.js');
var UserIvrInfo = require('./userivrinfo.js');
var BridgeAdminInfo = require('./bridgeadmininfo.js');

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

BridgeInfo.getBridgeInfo = Q.async(function(bridge_identifier) {
  console.log("Nitesh -- Getting the bridge info for  ["+ bridge_identifier + "]");
  if (bridge_identifier !== undefined) {
    db.getConfBridgeProfile(bridge_identifier)
    .then(function processBridgeProfile(result) { 
      if (result !== undefined) {
        console.log("Nitesh -- Bridge Info is "+ JSON.stringify(result));
        var bridge_info = new BridgeInfo();
        bridge_info.init(result)
        .then (function() {
          return bridge_info;
        });
      }
      else {
        console.log("Can't find any bridge profile for this identifier ["+ bridge_identifier + "]");
        return undefined;
      }
    });
  } else {
    console.error("Received an invalid identifier");
    return undefined;
  }
});

BridgeInfo.prototype.init = Q.async(function(result) {
  this.bridge_identifier = result['bridge_identifier'];
  this.remote_sip_uri = result['remote_sip_uri'];
  this.moh = Boolean(result['moh']);
  this.waiting_bridge = Boolean(result['waiting_bridge']);
  this.max_participants = result['max_participants'];
  this.pin_auth = Boolean(result['pin_auth']);
  this.bridge_passcode = result['bridge_passcode'];
  this.pin_retries = result['pin_tries'];
  this.participant_control = Boolean(result['participant_control']);
  this.admin_control = Boolean(result['admin_control']);

  var admin_profile_id = result['admin_prof_id'];
  var participant_ivr_profile_id = result['participant_prof_id'];

  if (this.participant_control === true && participant_ivr_profile_id !== undefined) {
    console.log("Nitesh -- getting the IVR profile for the participant");
    UserIvrInfo.getUserIvrInfo(participant_ivr_profile_id)
    .then(function setIvrProfile(user_ivr_profile) {
       console.log("Nitesh -- IVR profile retrieved");
       if (user_ivr_profile !== undefined) {
         this.participant_ivr_profile = user_ivr_profile;
       } else {
         this.participant_control = false;
       }
    })
    .catch(function(err) {
      console.error("couldn't get IVR stuff "+ err);
    })
    .done();
  }
   
  
  if (this.admin_control === true && admin_profile_id !== undefined) {
    BridgeAdminInfo.getBridgeAdminInfo(admin_profile_id)
    .then(function setAdminProfile(admin_profile) {
      if (admin_profile !== undefined) {
        this.admin_profile = admin_profile;
      } else {
        this.admin_control = false;
      }
    });
  }
  
});

module.exports = BridgeInfo;
