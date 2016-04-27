'use strict';

var mysql = require('mysql');
var Q = require('q');

function MySqlDB(dbConfig) {

  var config =  {host  : dbConfig.dbHost,
        	 user     :  dbConfig.dbUser,
		 password :  dbConfig.dbPass,
        	 database :  dbConfig.dbDatabase
		};


  /**
   * Retrieves the bridge profile.
   *
   * @return {Q} result - a promise containing the row where the bridge
   *   settings are stored
   */
  this.getBridgeProfile = function() {

   console.log('Nitesh -- Fetching bridge profile');
   var connection  = mysql.createConnection(config);
   var connect = Q.denodeify(connection.connect.bind(connection));
    return connect()
      .then(function (values) {
        var profile = dbConfig.bridgeProfile;
    	var query = Q.denodeify(connection.query.bind(connection));

        return query('SELECT exists(SELECT 1 FROM bridge_profile WHERE '
                   + 'bridge_type = ?) as profile_exists', [profile])
          .then(function (result) {
           if (result[0][0].table_exists !== '1') {
              profile = 'default';
            }
            return query('SELECT * FROM bridge_profile WHERE bridge_type = ?',
                         [profile]);
          })
          .then(function (result) {
            console.log('Fetched bridge profile', profile);
            return result[0][0];
          })
          .catch(function (err) {
            console.error(err);
          })
          .finally(function () {
	    connection.end();
          });
    })
    .catch(function (err) {
      console.error(err);
    });

  };

  /**
   * Retrieves a user profile.
   *
   * @param {String} userType - the type of user to retrieve
   * @return {Q} result - a promise containing the row where the user
   *   profile is stored
   */
  this.getUserProfile = function(userType) {
   console.log('Nitesh -- Fetching user profile');
   var connection  = mysql.createConnection(config);
   var connect = Q.denodeify(connection.connect.bind(connection));

    return connect()
      .then(function (values) {
    	var query = Q.denodeify(connection.query.bind(connection));

        return query('SELECT exists(SELECT 1 FROM user_profile WHERE '
                   + 'user_type = ?) as user_exists', [userType])
          .then(function (result) {
            if (!result[0][0].user_exists) {
              userType = 'default';
            }
            return query('SELECT * FROM user_profile WHERE user_type = '
                       + '?', [userType]);
          })
          .then(function (result) {
   	   console.log('Nitesh -- fetched user profile');
            return result[0][0];
          })
          .catch(function (err) {
            console.error(err);
          })
          .finally(function () {
	    connection.end();
          });
      })
      .catch(function (err) {
        console.error(err);
      });

  };

  /**
   * Retrieves a group profile.
   *
   * @param {String} groupType - the type of group to retrieve
   * @return {Q} result - a promise containing the row where the group
   *   profile is stored
   */
  this.getGroupProfile = function(groupType) {
   console.log('Nitesh -- Fetching group profile');
   var connection  = mysql.createConnection(config);
   var connect = Q.denodeify(connection.connect.bind(connection));

    return connect()
      .then(function (values) {

    	var query = Q.denodeify(connection.query.bind(connection));
        return query('SELECT exists(SELECT 1 FROM group_profile WHERE '
                   + 'group_type = ?) as group_exists', [groupType])
          .then(function (result) {
            if (!result[0][0].group_exists) {
              groupType = 'default';
            }
            return query('SELECT * FROM group_profile WHERE group_type = '
                       + '?', [groupType]);
          })
          .then(function (result) {
            return result[0][0];
   	    console.log('Nitesh -- Fetched group profile');
          })
          .catch(function (err) {
            console.error(err);
          })
          .finally(function () {
	    connection.end();
          });
      })
      .catch(function (err) {
        console.error(err);
      });

  };

  /**
   * Retrieves the bridge profile for this channel.
   *
   * @param {String} bridgeIdentifier - the type of group to retrieve
   * @return result - conf bridge profile for this channel
   */
  this.getConfBridgeProfile = function(bridge_identifier) {

   console.log('Nitesh -- Fetching the conf bridge profile for the identifier '+bridge_identifier);
   var connection  = mysql.createConnection(config);
   var connect = Q.denodeify(connection.connect.bind(connection));
   return connect()
     .then(function (values) {
       var query = Q.denodeify(connection.query.bind(connection));
       return query('SELECT * FROM confbridge WHERE bridge_identifier = ?',
                         [bridge_identifier])
       .then(function (result) {
         console.log('Fetched bridge profile for ', bridge_identifier);
         return result[0][0];
       })
       .catch(function (err) {
         if (err) {
           console.error("Failed to fetch the bridge profile for ", bridge_identifier);
           console.error(err);
         }
       })
       .finally(function () {
	 connection.end();
       });
    })
    .catch(function (err) {
      console.error(err);
    });

  };

}

module.exports = MySqlDB;
