'use strict';

var db = require('../../data/db.js');
var BridgeAdminIvrInfo = require('./bridgeadminivrinfo.js');

function BridgeAdminInfo() {

  /*Special key to activate admin menu*/
  this.menu_key = '#';
  
  /*Passcode for admin*/
  this.passcode = undefined;

  this.pin_retries = 3;

  /*Will be set if admin is assigned a special access number*/
  this.access_e164 = undefined;

  this.ivr_profile = undefined;
  
};


BridgeAdminInfo.getBridgeAdminInfo = Q.async(function(admin_profile_id) {
  if (admin_profile_id !== undefined) {
    db.getAdminProfile(admin_profile_id)
    .then(function processAdminProfile(result) { 
      if (result !== undefined) {
        var admin_info = new BridgeAdminInfo();
        admin_info.init(result);
        return admin_info;
      } else {
        console.error("Can't find any admin profile for this id ["+ admin_profile_id + "]");
        return undefined;
      }
    });
  }
  else {
    console.error("Received an invalid profile id for admin profile");
    return undefined;
  }
});


BridgeAdminInfo.prototype.init = function(result) {
  this.menu_key = result['admin_menu_key'];
  this.passcode = result['admin_passcode'];
  this.pin_retries = result['pin_retries'];
  this.access_e164 = result['admin_access_e164'];

  var ivr_profile_id = result['admin_ivr_profile_id'];
  var ivr_profile = undefined;
  if (ivr_profile_id !== undefined) {
    BridgeAdminIvrInfo.getAdminIvrInfo(ivr_profile_id)
    .then(function setIvrProfile(ivr_profile) {
      if (ivr_profile !== undefined) {
        this.ivr_profile = ivr_profile;
      } else {
        console.error("Couldn't find the admin ivr profile for the id ["+ ivr_profile_id + "]");
      }
    });
  }
};


module.exports = BridgeAdminInfo;
