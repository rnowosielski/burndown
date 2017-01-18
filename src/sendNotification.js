"use strict";
var requestify = require('requestify');
const crypto = require('crypto');
var Promise = require('promise');

function sendNotification(roomId, authToken, color, message_format, content) {
  return new Promise((resolve, reject) => {
    var response = {
      "color": color,
      "message": content,
      "notify": false,
      "message_format": message_format
    };
    console.log("Informing the channel");
    requestify.post(`https://api.hipchat.com/v2/room/${roomId}/notification?auth_token=${authToken}`,
      response)
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

module.exports = sendNotification;