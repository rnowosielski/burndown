"use strict";
var requestify = require('requestify');
const crypto = require('crypto');
var Promise = require('promise');

function getAccessToken(oauthId, oauthSecret) {
  return new Promise((resolve, reject) => {
    requestify.post("https://api.hipchat.com/v2/oauth/token", {
      grant_type: "client_credentials",
      scope: "send_notification send_message"
    }, {
      headers: {
        "Authorization": "Basic " + new Buffer(oauthId + ":" + oauthSecret).toString('base64')
      },
      dataType: "form-url-encoded"
    }).then(function (response) {
      var body = response.getBody();
      if (body) {
        console.log(body)
      }
      resolve(response.getBody().access_token);
    }).fail(function (response) {
      console.log("auth token: " + response.getCode());
      var body = response.getBody();
      if (body) {
        console.log(body)
      }
      reject("error")
    });
  });
}

module.exports = getAccessToken;