'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const httpStatus = require('http-status');
const swaggerize = require('swaggerize-express');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const app = express();
const winston = require('winston');
const expressWinston = require('express-winston');
require('app-module-path').addPath(__dirname);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

winston.configure({
  transports: [
    new (winston.transports.Console)({
      label: {
        stage: global.stage
      },
      json: true,
      stringify: true,
      level: global.defaultLogLevel
    })
  ]
});

expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
app.use(expressWinston.logger({
  transports:[
    new (winston.transports.Console)({
      json:true,
      stringify:true,
      level: 'info',
      timestamp:true
    })
  ]
}));

app.use(awsServerlessExpressMiddleware.eventContext());

app.use(swaggerize({
  api: __dirname + '/swagger.yaml'
}));

app.use(expressWinston.errorLogger({
  transports: [
    new (winston.transports.Console)({
      json:true,
      stringify:true,
      timestamp: true,
      level: 'error'
    })
  ],
  dumpExceptions:true,
  showStack: true
}));

app.use(function (err, req, res, next) {
  if (err.name == "ValidationError") {
    if (err.details.message) {
      res.status(httpStatus.BAD_REQUEST).json(err.details.message);
    } else {
      var errorMessages = [];
      err.details.forEach(function (item, index) {
        errorMessages.push(item.message);
      });
      res.status(httpStatus.BAD_REQUEST).json(errorMessages);
    }
  }
  else {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json("Something broke! Come back in a while.")
  }
});

module.exports = app;
