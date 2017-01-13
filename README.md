# Burndown

This is a POC of a hipchat extension that would react to messagess in the hipchat room (mostly agile buzzwords) and fetch burndown from an agile board in Jira in order to share with the room participants
The purpose and the main use case was to help distributed scrum teams collaborate better around scrum ceremonies and improve their burndown, by removing the visibility gap that colocated teams don't suffer from.

## Deployment

This is just a POC, so getting this deployed in you AWS account may require some manual steps. If the extensions proves usefule I might be investing more time in it, but for now it is what it is.
So before continuing, you need to update some values in the source files.

1. Call `rake -T` to see available tasks. What you will see is a message to 

        Setup @awsAccount variable in Rakefile
        Setup @lambdaRoleArn variable in Rakefile
        
   Don't forget to remove the `exit` statement that prevents further execution of the Rakefile after configuring the above.       
       
2. Once you configure the missing variables in the Rakefile `rake -T` should list all the available options.
       
        rake deploy[environment]              # Deploy and cleanup
        rake install_phantomjs                # Installs phantomjs binaries
        rake render_configuration             # Creates default configuration for t...
        rake swaggerless:clean                # Clean
        rake swaggerless:clean_aws_resources  # Clean AWS resources
        rake swaggerless:delete[environment]  # Remove stage and cleanup
        rake swaggerless:deploy[environment]  # Deploys to an environment specified...
        rake swaggerless:package              # Package the project for AWS Lambda
       
3. Let's start with deployment. On the first run `rake deploy[stagename]` the task `render_configuration` will execute and will prompt for couple of answers:
 
        Setup value for jira_url: Host name of the Jira instance
        
        Setup value for jira_user: Username to use when accesing Jira
        
        Setup value for jira_password: Password to authorize with when accessing Jira
        
        Setup value for s3_bucket: A name of a versione S3 bucket to use
        
        Setup value for dynamo_table: A name of DynamoDB table to create
        
        Setup value for hipchat_group: Restriction of the hipchat group
        
For some of these steps you may have to perform some manual actions, such as creating S3 bucket (as long as you don't already have one you want to re-use)

After that last question `rake deploy[stagename]` will continue to create API Gateway along with all the required bootstrapping and the stage

The code relies on the images in the S3 bucket to have their thumbnails generated, otherwise thumbnails fall back to original images.
I recommend deploying and hookign up lambda such as [aws-lambda-image](https://github.com/ysugimoto/aws-lambda-image) that will take care of creating necessary thumbnails whenever an object gets added to the bucket.

## Usage

At this point you should be able to install the extension by passing `/install` endpoint url in hipchat room managements

After the extension is installed you need to associate the room with the jira board you want to extract the burndown from.

After that the add on in room will react to words such as: burndown, sprint, standup, stup and display the team's burndown

## Development status

If this proves to be useful in practice (or usefule to anyone else who reaches out to me) I might spend time cleaning up and developping this POC. If you think this might be useful to you feel free to either create issues or contribute.