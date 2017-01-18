"use strict";
const httpStatus = require('http-status');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

module.exports = {
  get: function (req, res) {
    var params = {
      Bucket: process.env.s3bucket,
      Key: req.params.id
    };
    s3.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        res.status(httpStatus.NOT_FOUND).send()
      }
      else {
        res.set('Content-Type', 'application/octet-stream');
        console.log(data);
        res.send(data.Body);
      }
    });
  }
}