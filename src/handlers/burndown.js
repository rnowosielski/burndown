"use strict";
const Promise = require('promise');
const requestify = require('requestify');
const httpStatus = require('http-status');
const jwtUtil = require('jwt-simple');
const roomConfig = require("configurationStore");
const fs = require('fs');
const spawn = require('child_process').spawn;
const crypto = require('crypto');
const AWS = require('aws-sdk');
const notification = require("sendNotification");
const getAccessToken = require("getAccessToken");
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const winston = require("winston");

function upload_image_to_s3(hash, path) {
  return new Promise((resolve, reject) => {
    try {
      winston.debug("Will try to upload the image to S3");
      if (!fs.existsSync(path)) {
        winston.debug("File doesnt exist ", {path: path});
        reject("File not found: " + path)
      } else {
        winston.debug("Reading file", {path: path});
        let fileStream = fs.createReadStream(path);
        let expired = new Date();
        expired.setHours(expired.getHours() + 12);
        let params = {
          Bucket: process.env.s3bucket,
          Key: "cached/" + hash + ".png",
          Body: fileStream,
          Expires: expired.getTime() / 1000
        };
        winston.debug("Putting object", params);
        s3.putObject(params, function (err, data) {
          if (err) {
            winston.error("Error while putting the object", err);
            reject(err);
          }
          else {
            winston.debug("Successfully sent data to S3", data);
            resolve(data)
          }
        });
      }
    } catch (err) {
      winston.error(err)
    }
  });
}

function render_page(roomId, authToken, renderedPage) {
  return new Promise((resolve, reject) => {
    let fileFromPhantom = "/tmp/capture.png";
    if (fs.existsSync(fileFromPhantom)) {
      fs.unlinkSync(fileFromPhantom)
    }
    winston.debug("Adding " + process.env['LAMBDA_TASK_ROOT'] + " to path",  process.env)
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
    notification.send(roomId, authToken, "yellow", "text", "The cached image is a little out of date. Let me go and fetch the burndown from the web. It might take some time. After that the burndown will be cached for some time...")
    winston.debug("Running phantomjs");
    let program = spawn("phantomjs", ["render-page.js",
      renderedPage, process.env.waitForSelector, process.env.renderSelector, process.env.jiraUser + ":" + process.env.jiraPassword], { cwd: __dirname + "/.." })
    program.stdout.on('data', (data) => {
      winston.debug("phantomjs stdout: ", data.toString());
    });
    program.stderr.on('data', (data) => {
      winston.debug("phantomjs stderr: ", data.toString());
    });
    program.on('exit', (code) => {
      winston.debug(`Child process exited with code ${code}`);
      let hash = crypto.createHash('sha1').update(renderedPage).digest('base64');
      upload_image_to_s3(hash, fileFromPhantom).then(resolve, function() {
        return notification.send(roomId, authToken, "red", "text", "Failed to fetch the burndown").then(reject, reject)
      });
    });
  });
}

function get_burndown_card_mesage(req, hash, renderedPage, data) {
  let card = {
    style: "link",
    url: `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}/burndown/${hash}/${data.VersionId}/image.png`,
    id: "fee4d9a3-685d-4cbd-abaa-c8850d9b1960",
    title: "Team's burndown chart",
    format: "compact",
    description: {
      format: "html",
      value: `Click on the <i>thumbnail</i> or <i>title</i> to open the image in hipchat or <a href="${renderedPage}"><b>click here</b></a> to open dashboard in Jira`
    },
    thumbnail: {
      url: `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}/burndown/${hash}/${data.VersionId}/thumbnail.png`,
    },
    date: new Date().getTime()
  };
  return {
    color: "gray",
    message: "burndown",
    notify: false,
    message_format: "text",
    icon: {
      "url": `https://s3-eu-west-1.amazonaws.com/${process.env.s3bucket}/logo_small.png`,
    },
    card: card
  };
}

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
        winston.debug("Recievied body of the message", req.body);
        roomConfig.get({ roomId: roomId }, function (err, roomConfiguration) {
          winston.debug("Retrieved saved room configuration", roomConfiguration);
          if (err || !roomConfiguration) {
            res.status(httpStatus.NOT_FOUND).send();
          } else if (roomConfiguration.oauthId == req.body.oauth_client_id) {
            try {
              jwtUtil.decode(req.headers.authorization.split(" ")[1], roomConfiguration.oauthSecret);
              winston.debug("Getting access token");
              getAccessToken(roomConfiguration.oauthId, roomConfiguration.oauthSecret).then(function (accessToken) {
                try {
                  let time = null;
                  if (roomConfiguration.lastMessageTimestamp && roomConfiguration.quietPeriod) {
                    time = new Date(roomConfiguration.lastMessageTimestamp);
                    time.setSeconds(time.getSeconds() + roomConfiguration.quietPeriod);
                    winston.debug("Comparing times to asses the quite zone", { timeOfLastMessage: time, timeOfQuietZoneExpiry: new Date()});
                  }
                  if (roomConfiguration.viewId && (!time || time < new Date())) {
                    let renderedPage = `${process.env.jiraUrl}/jira/secure/RapidBoard.jspa?rapidView=${roomConfiguration.viewId}&view=reporting&chart=burndownChart`;
                    let hash = crypto.createHash('sha1').update(renderedPage).digest('base64');
                    let sendImageToRoom = function (data) {
                      return new Promise((resolve, reject) => {
                        try {
                          winston.debug("Will send burndown card to the room");
                          roomConfiguration.lastMessageTimestamp = new Date().getTime();
                          roomConfiguration.save(function (err) {
                            notification.sendObject(roomId, accessToken, get_burndown_card_mesage(req, hash, renderedPage, data)).then(
                              resolve, reject);
                          })
                        } catch (e) {
                          winston.error("Unable to send burndown to the room");
                        }
                      });
                    };
                    let params = {
                      Bucket: process.env.s3bucket,
                      Key: "cached/" + hash + ".png"
                    };
                    s3.getObject(params, function (err, data) {
                      winston.debug("Got object from S3", data);
                      let expired = new Date();
                      expired.setMinutes(expired.getMinutes() - 30);
                      if (err || (data.LastModified && new Date(data.LastModified) <= expired)) {
                        render_page(roomId, accessToken, renderedPage).then(sendImageToRoom).then(complete_with_ok);
                      }
                      else {
                        sendImageToRoom(data).then(complete_with_ok);
                      }
                    });
                  } else if (!roomConfiguration.viewId) {
                    notification.send(roomId, accessToken, "yellow", "text", "You need to first call /burn register <rapidViewId> [with <second>s quiet period] to register burndown for display")
                      .then(complete_with_ok, complete_with_ok)
                  } else {
                    complete_with_ok()
                  }
                } catch (e) {
                  winston.error(e);
                }
              }, function () {
                res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
              });
            } catch (e) {
              res.status(httpStatus.FORBIDDEN).send();
            }
          } else {
            res.status(httpStatus.FORBIDDEN).send();
          }
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).send();
      }
  }
};