"use strict";
const roomConfig = require("configurationStore");
const httpStatus = require('http-status');

module.exports = {
  post: function (req, res) {
    var room = new roomConfig({
      roomId: req.body.roomId,
      oauthId:  req.body.oauthId,
      capabilitiesUrl:  req.body.capabilitiesUrl,
      groupId:  req.body.groupId,
      oauthSecret:  req.body.oauthSecret
    });
    room.save(function(err) {
      if (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
      } else {
        res.status(httpStatus.OK).send()
      }
    })
  }
};