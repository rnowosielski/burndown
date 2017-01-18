"use strict";
const roomConfig = require("configurationStore");
const httpStatus = require('http-status');
var sendNotification = require("sendNotification");
var getAccessToken = require("getAccessToken");

function get_complete_with_ok(res) {
  return function() {
    res.status(httpStatus.OK).send();
  };
}

module.exports = {
  post: function (req, res) {
    var complete_with_ok = get_complete_with_ok(res);
    if (req.body.event == "room_message") {
      var roomId = req.body.item.room.id;
      roomConfig.get({ roomId: roomId }, function (err, roomConfiguration) {
        if (err || !roomConfiguration) {
          res.status(httpStatus.FORBIDDEN).send()
        } else if (roomConfiguration.oauthId == req.body.oauth_client_id) {
          getAccessToken(roomConfiguration.oauthId, roomConfiguration.oauthSecret).then(function (accessToken) {
            var message = req.body.item.message.message;
            var components = message.split(" ");
            if (components[0] == "/burn" && components[1] == "register" && components.length >= 3) {
              try {
                var rapidViewId = components[2];
                roomConfiguration.viewId = rapidViewId;
                roomConfiguration.save(function (err) {
                  if (!err) {
                    sendNotification(roomId, accessToken, "green", "text", `Registered view ${rapidViewId}, whatever that is...`).then(complete_with_ok, complete_with_ok);
                  } else {
                    sendNotification(roomId, accessToken, "red", "text", `Registration seems to have failed`).then(complete_with_ok, complete_with_ok);
                  }
                });
              } catch (e) {
                console.log(e);
              }
            } else {
              sendNotification(roomId, accessToken, "red", "text", `You are missing something in your command...`).then(complete_with_ok, complete_with_ok);
              res.status(httpStatus.BAD_REQUEST).send()
            }
          }, complete_with_ok)
        } else {
          res.status(httpStatus.FORBIDDEN).send()
        }
      });
    } else {
      res.status(httpStatus.NOT_ACCEPTABLE).send()
    }
  }
};