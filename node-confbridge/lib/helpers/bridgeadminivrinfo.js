'use strict';

var db = require('../../data/db.js');
var Q = require('q');

function BridgeAdminIvrInfo() {
  this.rollcall_key = undefined;
  this.toggle_mute_all_key = undefined;
  this.toggle_lock_key = undefined;
  this.destroy_bridge_key = undefined;
  this.get_participant_count_key = undefined;
};


BridgeAdminIvrInfo.getAdminIvrInfo = Q.async(function(ivr_profile_id) {
  if (ivr_profile_id !== undefined) {
    db.getAdminIvrProfile(ivr_profile_id)
    .then(function processAdminIvrProfile(result) {
      if (result !== undefined) {
        var admin_ivr_info = new AdminIvrInfo();
        admin_ivr_info.init(result);
        return admin_ivr_info;
      } else {
        console.log("Can't find any admin ivr profile for this id ["+ ivr_prof_id + "]");
        return undefined;
      }
    });
  }
  else {
    console.error("Received an invalid profile id for admin ivr");
    return undefined;
  }
});


BridgeAdminIvrInfo.prototype.init = function(result) {
  this.rollcall_key = result['rollcall'];
  this.toggle_mute_all_key = result['toggle_mute_all'];
  this.toggle_lock_key = result['toggle_lock_bridge'];
  this.destroy_bridge_key = result['destroy_bridge'];
  this.get_participant_count_key = result['get_participant_count'];
}


module.exports = BridgeAdminIvrInfo;
