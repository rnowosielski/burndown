"use strict";
const httpStatus = require('http-status');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = {
  get: function (req, res) {
    var signedUrlExpireSeconds = 3600;
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.s3bucket,
      Key: "cached/" + req.params.id + ".png",
      Expires: signedUrlExpireSeconds,
      VersionId: req.params.version
    });
    res.redirect(url)
  }
}