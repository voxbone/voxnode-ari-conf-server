'use strict';

var db = require('../../data/db.js');

function UserIvrInfo() {
  this.toggle_mute_key = undefined;
  this.toggle_deafmute_key = undefined;
};


UserIvrInfo.getUserIvrInfo = Q.async(function(participant_prof_id) {
  if (participant_prof_id !== undefined) {
    db.getUserIvrProfile(participant_prof_id)
    .then(function processUserIvrProfile(result) { 
      if (result !== undefined) {
        var user_ivr_info = new UserIvrInfo();
        user_ivr_info.init(result);
        return user_ivr_info;
      } else {
        console.log("Can't find any participant profile for this id ["+ participant_prof_id + "]");
        return undefined;
      }
    }).
    catch(function handleError(err) {
      console.error("Nitesh -- error is "+ err);
    })
    .done();
  }
  else {
    console.error("Received an invalid profile id for user ivr");
    return undefined;
  }
});


UserIvrInfo.prototype.init = function(result) {
  this.toggle_mute_key = result['toggle_mute'];
  this.toggle_deafmute_key = result['toggle_deafmute'];
};


module.exports = UserIvrInfo;
