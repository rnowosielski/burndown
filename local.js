'use strict'
var winston = require('winston');
const app = require('./src/app')

app.listen(3000, function () {
    winston.info('DEVELOPMENT: Listening on port 3000!');
})