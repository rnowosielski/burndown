# Burndown

This is a POC of a hipchat extension that would react to messagess in the hipchat room (mostly agile buzzwords) and fetch burndown from an agile board in Jira in order to share with the room participants
The purpose and the main use case was to help distributed scrum teams collaborate better around scrum ceremonies and improve their burndown, by removing the visibility gap that colocated teams don't suffer from.

## Deployment

This is just a POC, so getting this deployed in you AWS account may require some manual steps. If the extensions proves usefule I might be investing more time in it, but for now it is what it is.
So before continuing, you need to update some values in the source files.

1. In `src/lambda.js` there are predefined values for the env variables. You might update them in the code, or through the AWS console on the deployed lambda:
    - jira url
    - jira username
    - jira password
2. In `swagger.yaml` update the domain that will point to your API
3. In `Rakefile` update the account id and role (and whatever else you need to adapt).

After that calling `rake swaggerless:deploy[env_name]` will create API Gateway along with all the required bootstrapping as well create a stage names `rake env_name`

## Usage

At this point you should be able to install the extension by passing `/install` endpoint url in hipchat room managements

After the extension is installed you need to associate the room with the jira board you want to extract the burndown from.

After that the add on in room will react to words such as: burndown, sprint, standup, stup and display the team's burndown

## Development status

If this proves to be useful in practice (or usefule to anyone else who reaches out to me) I might spend time cleaning up and developping this POC. If you think this might be useful to you feel free to either create issues or contribute.