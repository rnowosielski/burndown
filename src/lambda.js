'use strict';
var winston = require('winston');
try {
  winston.info("Loading configuration");
  require("./configure")();
} catch (e) {
  winston.error(e);
}
const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
