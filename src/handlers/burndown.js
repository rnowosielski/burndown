"use strict";
const roomConfig = require("configurationStore");
var requestify = require('requestify');
var fs = require('fs');
var spawn = require('child_process').spawn;
const crypto = require('crypto');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
const httpStatus = require('http-status');
var sendNotification = require("sendNotification");
var getAccessToken = require("getAccessToken");

function render_page(roomId, authToken, renderedPage, done) {
  var timeBegin = new Date().getTime();
  if (fs.existsSync("/tmp/capturedBase64")) {
    fs.unlinkSync("/tmp/capturedBase64")
  }
  console.log("Adding " + process.env['LAMBDA_TASK_ROOT'] + " to path")
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
  sendNotification(roomId, authToken, "gray", "text", "Let me go and fetch the burndown from the web. It might take some time.")
  console.log("Running phantomjs");
  try {
    var program = spawn("phantomjs", ["render-page.js",
      renderedPage, process.env.waitForSelector, process.env.renderSelector, process.env.jiraUser + ":" + process.env.jiraPassword], { cwd: __dirname + "/.." })
    program.stdout.on('data', (data) => {
      console.log("phantomjs stdout: " + data.toString().trim());
    });
    program.stderr.on('data', (data) => {
      console.log("phantomjs stderr: " + data.toString().trim());
    });
    program.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      try {
        var fileStream = fs.createReadStream("/tmp/capturedBase64");
        var hash = crypto.createHash('sha1').update(renderedPage).digest('base64');
        var expired = new Date();
        expired.setHours(expired.getHours() + 12);
        var params = {
          Bucket: process.env.s3bucket,
          Key: hash,
          Body: fileStream,
          Expires: expired.getTime()/1000
        };
        console.log("Putting object")

        s3.putObject(params, function(err, data) {
          if (err) {
            console.log(err);
            done(err);
          }
          else {
            console.log(data);
            done();
          }
        });
      } catch (e) {
        sendNotification(roomId, authToken, "red", "text", "Failed to fetch the burndown.")
        done();
      }
    });
  } catch (e) {
    sendNotification(roomId, authToken, "red", "text", e.message);
  }
}

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
        console.log(JSON.stringify(req.body));
        roomConfig.get({ roomId: roomId }, function (err, roomConfiguration) {
          console.log(JSON.stringify(roomConfiguration));
          if (err || !roomConfiguration) {
            res.status(httpStatus.NOT_FOUND).send();
          } else if (roomConfiguration.oauthId == req.body.oauth_client_id) {
            console.log("Getting access token");
            getAccessToken(roomConfiguration.oauthId, roomConfiguration.oauthSecret).then(function (accessToken) {
              console.log("Will call the webhook");
              try {
                if (roomConfiguration.viewId) {
                  var renderedPage = `${process.env.jiraUrl}/jira/secure/RapidBoard.jspa?rapidView=${roomConfiguration.viewId}&view=reporting&chart=burndownChart`;
                  var hash = crypto.createHash('sha1').update(renderedPage).digest('base64');
                  var params = {
                    Bucket: process.env.s3bucket,
                    Key: hash
                  };
                  var url = `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}/images/${hash}/raw`;
                  var sendImageToRoom = function () {
                    return sendNotification(roomId, accessToken, "gray", "html", `<img src="${url}">`).then(
                      complete_with_ok, complete_with_ok
                    );
                  };
                  s3.getObject(params, function (err, data) {
                    console.log(data)
                    var expired = new Date();
                    expired.setMinutes(expired.getMinutes() - 30);
                    if (err || (data.LastModified && new Date(data.LastModified) <= expired)) {
                      render_page(roomId, accessToken, renderedPage, function (err) {
                        sendImageToRoom()
                      });
                    }
                    else {
                      sendImageToRoom();
                    }
                  });
                } else {
                  sendNotification(roomId, accessToken, "yellow", "text", "You need to first call /burn register [rapidViewId] to register burndown for display")
                    .then(complete_with_ok, complete_with_ok)
                }
              } catch (e) {
                console.log(e);
              }
            }, function () {
              res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
            });
          } else {
            res.status(httpStatus.FORBIDDEN).send();
          }
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).send();
      }
  }
};