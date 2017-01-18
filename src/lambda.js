'use strict'
const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const server = awsServerlessExpress.createServer(app);

if (!process.env.jiraUrl) {
  process.env.jiraUrl = "https://your.jira.url"
}

if (!process.env.waitForSelector) {
  process.env.waitForSelector = "canvas.overlay"
}

if (!process.env.renderSelector) {
  process.env.renderSelector = "#ghx-chart-wrap"
}

if (!process.env.jiraUser) {
  process.env.jiraUser = "jira_user"
}

if (!process.env.jiraPassword) {
  process.env.jiraPassword = "jira_password"
}

if (!process.env.s3bucket) {
  process.env.s3bucket = "your_s3_bucket"
}

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
