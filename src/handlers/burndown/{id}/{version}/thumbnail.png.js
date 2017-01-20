"use strict";
const Promise = require('promise');
const httpStatus = require('http-status');
const AWS = require('aws-sdk');
const winston = require("winston");
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = {
  get: function (req, res) {

    let get_image_date = new Promise((resolve, reject) => {
      var params = {
        Bucket: process.env.s3bucket,
        Key: "cached/" + req.params.id + ".png",
        VersionId: req.params.version
      };
      winston.debug("Getting the modification time for the original image object", params);
      s3.getObject(params, function (err, data) {
        if (err) {
          winston.error("Unable to get object image object from S3", err);
          reject(err);
        }
        else {
          delete data.Body;
          winston.debug("Retrieved original image object from S3", data);
          resolve(new Date(data.LastModified));
        }
      });
    });

    let get_version_afer_date = function(date) {
      try {
        return new Promise((resolve, reject) => {
          var params = {
            Bucket: process.env.s3bucket,
            Delimiter: '/',
            MaxKeys: 100,
            Prefix: "cached/resized/small/" + req.params.id + ".png"
          };
          winston.debug("Retrieving thumbnail versions available for original image in S3", params);
          s3.listObjectVersions(params, function (err, data) {
            if (err || (data.Versions && data.Versions.length == 0)) {
              winston.error("Unable to retrieve thumbnail versions S3", err);
              reject(err);
            }
            else {
              winston.debug("Retrieved thumbnail versions", data);
              var filteredAndSortedVersions = data.Versions.filter(function (element) {
                return new Date(element.LastModified) > date;
              });
              filteredAndSortedVersions.sort(function (a, b) {
                 return new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime();
              });
              winston.debug("Filtered and sorted versions", filteredAndSortedVersions);
              if (filteredAndSortedVersions.length == 0) {
                reject("filteredAndSortedVersions is empty");
              } else {
                resolve(filteredAndSortedVersions[0]);
              }
            }
          });
        });
      } catch (e) {
        console.log(e);
      }
    };

    get_image_date.then(function(result) { return get_version_afer_date(result); }).then(function(data) {
      var signedUrlExpireSeconds = 3600;
      winston.debug("Generating singed url for version", data);
      const url = s3.getSignedUrl('getObject', {
        Bucket: process.env.s3bucket,
        Key: data.Key,
        Expires: signedUrlExpireSeconds,
        VersionId: data.VersionId
      });
      res.redirect(url);
    }, function(err) {
      winston.error(err);
      res.redirect(`https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}/burndown/${req.params.id}/${req.params.version}/image.png`);
    }).catch(function(err) {
      winston.error(err);
    });
  }
};