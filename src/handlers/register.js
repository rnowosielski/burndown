"use strict";
const httpStatus = require('http-status');
const jwtUtil = require('jwt-simple');
const roomConfig = require("configurationStore");
const notification = require("sendNotification");
const getAccessToken = require("getAccessToken");
const winston = require("winston");

function get_complete_with_ok(res) {
  return function() {
    res.status(httpStatus.OK).send();
  };
}

module.exports = {
  post: function (req, res) {
    let complete_with_ok = get_complete_with_ok(res);
    if (req.body.event == "room_message") {
      let roomId = req.body.item.room.id;
      roomConfig.get({ roomId: roomId }, function (err, roomConfiguration) {
        winston.debug(roomConfiguration);
        if (err || !roomConfiguration) {
          winston.error(err);
          res.status(httpStatus.FORBIDDEN).send()
        } else if (roomConfiguration.oauthId == req.body.oauth_client_id) {
          try {
            jwtUtil.decode(req.headers.authorization.split(" ")[1], roomConfiguration.oauthSecret);
            getAccessToken(roomConfiguration.oauthId, roomConfiguration.oauthSecret).then(function (accessToken) {
              let message = req.body.item.message.message;
              let components = message.split(" ");
              if (components[0] == "/burn" && components[1] == "register" && components.length >= 3) {
                try {
                  let rapidViewId = components[2];
                  roomConfiguration.viewId = rapidViewId;
                  if (components.length >= 5 && components[3] == "with") {
                    roomConfiguration.quietPeriod = parseInt(components[4]);
                  } else {
                    roomConfiguration.quietPeriod = 0;
                  }
                  roomConfiguration.save(function (err) {
                    if (!err) {
                      notification.send(roomId, accessToken, "green", "text", `Registered view ${rapidViewId} whatever that is...` + ((roomConfiguration.quietPeriod > 0) ? ` (with quiet period ${roomConfiguration.quietPeriod}s)` : "")).then(complete_with_ok, complete_with_ok);
                    } else {
                      notification.send(roomId, accessToken, "red", "text", `Registration seems to have failed`).then(complete_with_ok, complete_with_ok);
                    }
                  });
                } catch (e) {
                  winston.error(e);
                }
              } else {
                notification.send(roomId, accessToken, "red", "text", `You are missing something in your command...`).then(complete_with_ok, complete_with_ok);
                res.status(httpStatus.BAD_REQUEST).send()
              }
            }, complete_with_ok)
          } catch (e) {
            winston.error("Error: " + e.message);
            res.status(httpStatus.FORBIDDEN).send()
          }
        } else {
          winston.debug(`roomConfiguration.oauthId = ${roomConfiguration.oauthId} and req.body.oauth_client_id = ${req.body.oauth_client_id}`)
          res.status(httpStatus.FORBIDDEN).send()
        }
      });
    } else {
      winston.warn("Wront type of hipchat message");
      res.status(httpStatus.FORBIDDEN).send()
    }
  }
};