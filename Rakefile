require 'swaggerless'

cmd = 'cp package.json src/ && npm install --production --prefix src && rm src/package.json'
%x[ #{cmd} ]

@awsAccount = <your aws account>
# The lambda role needs to allow creation and access to DynamoDB, access to S3
@lambdaRoleArn = "arn:aws:iam::#{@awsAccount}:role/<your lambda role>"
@awsRegion = 'eu-west-1'
@swaggerSpecFile = 'src/swagger.yaml'
@packageDir = 'src'