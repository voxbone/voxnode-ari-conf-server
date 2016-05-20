-- MySQL dump 10.13  Distrib 5.5.47, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: voxconfcontrol
-- ------------------------------------------------------
-- Server version	5.5.47-0+deb8u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bridge_admin`
--

DROP TABLE IF EXISTS `bridge_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bridge_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bridge_id` int(11) NOT NULL,
  `admin_menu_key` varchar(4) DEFAULT '#',
  `admin_passcode` int(11) DEFAULT NULL,
  `pin_retries` int(11) NOT NULL DEFAULT '3',
  `admin_ivr_profile_id` int(11) NOT NULL,
  `admin_access_e164` varchar(19) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bridge_id` (`bridge_id`),
  CONSTRAINT `bridge_admin_ibfk_1` FOREIGN KEY (`bridge_id`) REFERENCES `conference_bridge` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bridge_admin_ivr`
--

DROP TABLE IF EXISTS `bridge_admin_ivr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bridge_admin_ivr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rollcall` varchar(4) DEFAULT NULL,
  `toggle_mute_all` varchar(4) DEFAULT NULL,
  `toggle_lock_bridge` varchar(4) DEFAULT NULL,
  `get_participant_count` varchar(4) DEFAULT NULL,
  `destroy_bridge` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bridge_profile`
--

DROP TABLE IF EXISTS `bridge_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bridge_profile` (
  `bridge_type` varchar(50) NOT NULL,
  `join_sound` varchar(50) NOT NULL,
  `leave_sound` varchar(50) NOT NULL,
  `pin_number` int(11) NOT NULL,
  `pin_retries` int(11) NOT NULL,
  `enter_pin_sound` varchar(50) NOT NULL,
  `bad_pin_sound` varchar(50) NOT NULL,
  `locked_sound` varchar(50) NOT NULL,
  `now_locked_sound` varchar(50) NOT NULL,
  `now_unlocked_sound` varchar(50) NOT NULL,
  `now_muted_sound` varchar(50) NOT NULL,
  `now_unmuted_sound` varchar(50) NOT NULL,
  `kicked_sound` varchar(50) NOT NULL,
  `record_conference` tinyint(1) NOT NULL,
  `recording_sound` varchar(50) NOT NULL,
  `wait_for_leader_sound` varchar(50) NOT NULL,
  PRIMARY KEY (`bridge_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `conference_bridge`
--

DROP TABLE IF EXISTS `conference_bridge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conference_bridge` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bridge_identifier` varchar(30) NOT NULL,
  `remote_sip_uri` varchar(128) DEFAULT NULL,
  `record` tinyint(4) NOT NULL DEFAULT '0',
  `moh` tinyint(4) NOT NULL DEFAULT '0',
  `waiting_bridge` tinyint(4) NOT NULL DEFAULT '0',
  `participant_control` tinyint(4) NOT NULL DEFAULT '0',
  `admin_control` tinyint(4) NOT NULL DEFAULT '0',
  `participant_prof_id` int(11) DEFAULT NULL,
  `admin_prof_id` int(11) DEFAULT NULL,
  `max_participants` tinyint(4) NOT NULL DEFAULT '10',
  `pin_auth` tinyint(4) NOT NULL DEFAULT '0',
  `bridge_passcode` int(11) DEFAULT NULL,
  `pin_retries` int(11) NOT NULL DEFAULT '3',
  PRIMARY KEY (`id`),
  UNIQUE KEY `bridge_identifier` (`bridge_identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_profile`
--

DROP TABLE IF EXISTS `group_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_profile` (
  `group_type` varchar(50) NOT NULL,
  `group_behavior` varchar(50) NOT NULL,
  `max_members` int(11) NOT NULL,
  PRIMARY KEY (`group_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participant_ivr`
--

DROP TABLE IF EXISTS `participant_ivr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `participant_ivr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `toggle_mute` varchar(4) DEFAULT NULL,
  `toggle_deafmute` varchar(4) DEFAULT NULL,
  `bridge_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bridge_id` (`bridge_id`),
  CONSTRAINT `participant_ivr_ibfk_2` FOREIGN KEY (`bridge_id`) REFERENCES `conference_bridge` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_profile`
--

DROP TABLE IF EXISTS `user_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_profile` (
  `user_type` varchar(50) NOT NULL,
  `admin` tinyint(1) NOT NULL,
  `moh` tinyint(1) NOT NULL,
  `quiet` tinyint(1) NOT NULL,
  `pin_auth` tinyint(1) NOT NULL,
  PRIMARY KEY (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-05-19  8:02:29
