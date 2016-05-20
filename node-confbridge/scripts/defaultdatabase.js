'use strict';

var mysql = require('mysql');
var Q = require('q');
var config = require('../config.json');

/*var connection = Q.denodeify(mysql.createConnection.bind({host     : 'voxconfdb',*/

var connection  = mysql.createConnection({host     : 'voxconfdb',
        user     :  config.dbUser,
        password :  config.dbPass,
        database :  config.dbDatabase});

console.log('Preparing database...');

var connect = Q.denodeify(connection.connect.bind(connection));

connect()
  .then(function (values) {
    console.log('...connected to database');
    var query = Q.denodeify(connection.query.bind(connection));

    console.log('...inserting data into bridge_profile');
    return query('INSERT INTO bridge_profile ('
                     + 'bridge_type,join_sound,leave_sound,pin_number,'
                     + 'pin_retries,enter_pin_sound,bad_pin_sound,'
                     + 'locked_sound,now_locked_sound,now_unlocked_sound,'
                     + 'now_muted_sound,now_unmuted_sound,kicked_sound,'
                     + 'record_conference,recording_sound,'
                     + 'wait_for_leader_sound) VALUES ('
                     + '\'default\',\'confbridge-join\','
                     + '\'confbridge-leave\',1234,3,\'confbridge-pin\','
                     + '\'conf-invalidpin\',\'confbridge-lock-no-join\','
                     + '\'confbridge-locked\',\'confbridge-unlocked\','
                     + '\'confbridge-muted\',\'confbridge-unmuted\','
                     + '\'confbridge-removed\',false,\'conf-now-recording\','
                     + '\'conf-waitforleader\')');
      )
      .then(function () {
        console.log('...inserting data into user_profile');
        return query('INSERT INTO user_profile (user_type,admin,moh,quiet,'
                     + 'pin_auth) VALUES (\'default\',false,true,false,'
                     + 'false)');
      })
      .then(function () {
        console.log('...inserting data into group_profile');
        return query('INSERT INTO group_profile (group_type,group_behavior,'
                     + 'max_members) VALUES (\'default\',\'participant\','
                     + '100)');
      })
      .catch(function (err) {
        console.error("Exception "+ err);
      })
      .finally(function () {
    	connection.end();
      });
  })
  .then(function () {
    console.log('...disconnected from database.');
  })
  .catch(function (err) {
    console.log('couldnt connect to DB');
    console.error(err);
    connection.end();
  })
  .finally(function () {
    connection.end();
    process.exit(0);
  })
  .done();
