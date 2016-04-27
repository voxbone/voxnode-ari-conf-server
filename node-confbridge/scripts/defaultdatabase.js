'use strict';

var mysql = require('mysql');
var Q = require('q');
var config = require('../config.json');

/*var connection = Q.denodeify(mysql.createConnection.bind({host     : 'voxconfdb',*/

var connection  = mysql.createConnection({host     : 'voxconfdb',
        user     :  'voxconf',
        password :  'voxconf',
        database :  'voxconfcontrol'});

console.log('Preparing database...');

var connect = Q.denodeify(connection.connect.bind(connection));

connect()
  .then(function (values) {
    console.log('...connected to database');
    var query = Q.denodeify(connection.query.bind(connection));

    return query('SELECT exists(SELECT TABLE_NAME FROM information_schema.tables where'
                 + ' table_name = \'bridge_profile\') as table_exists')
      .then(function (result) {
        if (result[0][0].table_exists == '1') {
          console.log('...deleting bridge_profile');
          return query('DROP TABLE bridge_profile');
        }
      })
      .then(function () {
        console.log('...creating bridge_profile');
        return query('CREATE TABLE bridge_profile ('
                     + 'bridge_type varchar (50) PRIMARY KEY,'
                     + 'join_sound varchar (50) NOT NULL,'
                     + 'leave_sound varchar (50) NOT NULL,'
                     + 'pin_number integer NOT NULL,'
                     + 'pin_retries integer NOT NULL,'
                     + 'enter_pin_sound varchar (50) NOT NULL,'
                     + 'bad_pin_sound varchar (50) NOT NULL,'
                     + 'locked_sound varchar (50) NOT NULL,'
                     + 'now_locked_sound varchar (50) NOT NULL,'
                     + 'now_unlocked_sound varchar (50) NOT NULL,'
                     + 'now_muted_sound varchar (50) NOT NULL,'
                     + 'now_unmuted_sound varchar (50) NOT NULL,'
                     + 'kicked_sound varchar (50) NOT NULL,'
                     + 'record_conference boolean NOT NULL,'
                     + 'recording_sound varchar (50) NOT NULL,'
                     + 'wait_for_leader_sound varchar (50) NOT NULL)');
      })
      .then(function () {
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
      })
      .then(function () {
        return query('SELECT exists(SELECT * FROM information_schema.tables '
                     + 'where table_name = \'user_profile\') as table_exists');
      })
      .then(function (result) {
        if (result[0][0].table_exists == '1') {
          console.log('...deleting user_profile');
          return query('DROP TABLE user_profile');
        }
      })
      .then(function () {
        console.log('...creating user_profile');
        return query('CREATE TABLE user_profile ('
                     + 'user_type varchar (50) PRIMARY KEY,'
                     + 'admin boolean NOT NULL,'
                     + 'moh boolean NOT NULL,'
                     + 'quiet boolean NOT NULL,'
                     + 'pin_auth boolean NOT NULL)');
      })
      .then(function () {
        console.log('...inserting data into user_profile');
        return query('INSERT INTO user_profile (user_type,admin,moh,quiet,'
                     + 'pin_auth) VALUES (\'default\',false,true,false,'
                     + 'false)');
      })
      .then(function () {
        return query('SELECT exists(SELECT * FROM information_schema.tables '
                     + 'where table_name = \'group_profile\')  as table_exists');
      })
      .then(function (result) {
        if (result[0][0].table_exists == '1') {
          console.log('...deleting group_profile');
          return query('DROP TABLE group_profile');
        }
      })
      .then(function () {
        console.log('...creating group_profile');
        return query('CREATE TABLE group_profile ('
                     + 'group_type varchar (50) PRIMARY KEY,'
                     + 'group_behavior varchar (50) NOT NULL,'
                     + 'max_members integer NOT NULL)');
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
	console.log("Nitesh -- disconnecting from database");
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
