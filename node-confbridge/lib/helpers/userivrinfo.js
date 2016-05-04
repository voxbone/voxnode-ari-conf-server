'use strict';

var db = require('../../data/db.js');
var Q = require('q');

function UserIvrInfo() {
  this.toggle_mute_key = undefined;
  this.toggle_deafmute_key = undefined;
};


UserIvrInfo.getUserIvrInfo = function(participant_prof_id) {
  return Q.Promise(function(resolve, reject, notify) {
    if (participant_prof_id !== undefined) {
      db.getUserIvrProfile(participant_prof_id)
      .then(function processUserIvrProfile(result) {
        if (result !== undefined) {
          var user_ivr_info = new UserIvrInfo();
          user_ivr_info.init(result);
          resolve(user_ivr_info);
        } else {
          console.log("Can't find any participant profile for this id ["+ participant_prof_id + "]");
          reject(new Error('No participants found'));
        }
      }).
      catch(function handleError(err) {
        console.error("Nitesh -- error is "+ err);
        reject(err);
      })
      .done();
    }
    else {
      console.error("Received an invalid profile id for user ivr");
      reject(new Error('Invalid profile ID given'));
    }
  });
};


UserIvrInfo.prototype.init = function(result) {
  this.toggle_mute_key = result['toggle_mute'];
  this.toggle_deafmute_key = result['toggle_deafmute'];
};


module.exports = UserIvrInfo;
