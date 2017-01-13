"use strict";
var requestify = require('requestify');
const crypto = require('crypto');
var Promise = require('promise');

function sendNotificationObject(roomId, authToken, params) {
  return new Promise((resolve, reject) => {
    console.log("Informing the channel");
    requestify.post(`https://api.hipchat.com/v2/room/${roomId}/notification?auth_token=${authToken}`, params)
      .then(function (response) {
        console.log("room notification: " + response.getCode());
        var body = response.getBody();
        if (body) {
          console.log(body)
        }
        resolve();
      })
      .fail(function (response) {
        console.log("room notification: " + response.getCode());
        var body = response.getBody();
        if (body) {
          console.log(body)
        }
        reject();
      });
  });
}

function sendNotification(roomId, authToken, color, message_format, content) {
  var params = {
    "color": color,
    "message": content,
    "notify": false,
    "message_format": message_format,
    "from": "notification",
    "icon": {
      "url": `https://s3-eu-west-1.amazonaws.com/${process.env.s3bucket}/logo_small.png`,
      "url@2x" : `https://s3-eu-west-1.amazonaws.com/${process.env.s3bucket}/logo_small.png`
    }
  };
  return sendNotificationObject(roomId, authToken, params);
}

module.exports = {
  send: sendNotification,
  sendObject: sendNotificationObject
};