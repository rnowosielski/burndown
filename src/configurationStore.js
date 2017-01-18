var dynamoose = require('dynamoose');

var roomConfig = new dynamoose.Schema({
  roomId: {
    type: Number,
    hashKey: true
  },
  oauthId: String,
  capabilitiesUrl: String,
  groupId: String,
  oauthSecret: String,
  viewId: String
});

var room = dynamoose.model('hipchat-integration', roomConfig);
module.exports = room
