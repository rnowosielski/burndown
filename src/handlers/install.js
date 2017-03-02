"use strict";

module.exports = {
  get: function (req, res) {
    let url = `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}`;
    res.json({
      name: "Burndown",
      description: "An integration that does send your squad's burndown from Jira to the hipchat room",
      key: "ext.jira-burndown",
      links: {
        self: url + "/install"
      },
      capabilities: {
        webhook: [
          {
            url: url + "/burndown?report=burndownChart&renderSelector=%23ghx-chart-wrap&waitSelector=canvas.overlay",
            pattern: "([bB][uU][rR][nN][dD][oO][wW][nN])|([Ss][Pp][rR][iI][Nn][tT])|([sS][Tt][Aa]?[Nn]?[Dd][uU][pP])",
            event: "room_message",
            authentication: "jwt",
            name: "Burndown"
          },
          {
            url: url + "/burndown?report=controlChart&renderSelector=%23control-chart&waitSelector=g.aggregate-mean",
            pattern: "([cC][oO][nN][tT][rR][oO][lL][ ]?[cC][hH][aA][rR][tT])",
            event: "room_message",
            authentication: "jwt",
            name: "Control Chart"
          },
          {
            url: url + "/register",
            pattern: "^/burn register",
            authentication: "jwt",
            event: "room_message",
            name: "Burndown Control"
          }
        ],
        installable: {
          allowGlobal: false,
          allowRoom: true,
          callbackUrl: url + '/installed'
        },
        hipchatApiConsumer: {
          avatar: {
            "url": `https://s3-eu-west-1.amazonaws.com/${process.env.s3bucket}/logo.png`
          },
          fromName: "Burndown",
          scopes: [
            "send_notification",
            "send_message"
          ]
        }
      }
    });
  }
};