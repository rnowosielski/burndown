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
  viewId: String,
  quietPeriod: Number,
  lastMessageTimestamp: Date
});

var room = dynamoose.model(process.env.dynamnoDbTable, roomConfig);
module.exports = room;
