require 'swaggerless'
require 'net/https'
require "zlib"
require 'open-uri'
require 'erb'

cmd = 'cp package.json src/ && npm install --production --prefix src && rm src/package.json'
%x[ #{cmd} ]

#@awsAccount = "<AWS account ID goes here>"
puts "Setup @awsAccount variable in Rakefile"
#@lambdaRoleArn = "arn:aws:iam::#{@awsAccount}:role/<lambda role name goes here>"
puts "Setup @lambdaRoleArn variable in Rakefile"
exit

@awsRegion = 'eu-west-1'
@swaggerSpecFile = 'src/swagger.yaml'
@packageDir = 'src'

desc "Installs phantomjs binaries"
task :install_phantomjs do
    if not File.exist?("src/phantomjs") then
        puts "Downloading phantomjs binaries"
        download = open('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2')
        IO.copy_stream(download, 'phantomjs.tar.bz2')
        puts "Unpacking phantomjs binaries"
        if not system("tar jxf phantomjs.tar.bz2") then
            throw
        else
            File.delete("phantomjs.tar.bz2")
        end
        FileUtils.cp 'phantomjs-2.1.1-linux-x86_64/bin/phantomjs', 'src/phantomjs'
    end
end

desc "Deploy and cleanup"
task :deploy, [ :environment ] => [ :render_configuration, :install_phantomjs, "swaggerless:deploy", "swaggerless:clean_aws_resources" ] do |t, args|

end

class Configuration
  include ERB::Util
  attr_accessor :jira_url, :jira_user, :jira_password, :s3_bucket, :dynamo_table, :hipchat_group

  def initialize(configs, template)
    @jira_url = configs['jira_url']
    @jira_user = configs['jira_user']
    @jira_password = configs['jira_password']
    @s3_bucket = configs['s3_bucket']
    @dynamo_table = configs['dynamo_table']
    @hipchat_group = configs['hipchat_group']
    @template = template
  end

  def render()

    ERB.new(@template).result(binding)
  end

  def save(file)
    File.open(file, "w+") do |f|
      f.write(render)
    end
  end
end

desc "Creates default configuration for the lambda."
task :render_configuration do
    if not File.exists?("src/configure.js") then

        configs = Hash.new { }
        configs['jira_url'] = "Host name of the Jira instance"
        configs['jira_user'] = "Username to use when accesing Jira"
        configs['jira_password'] = "Password to authorize with when accessing Jira"
        configs['s3_bucket'] = "A name of a versioned S3 bucket to use"
        configs['dynamo_table'] = "A name of DynamoDB table to create"
        configs['hipchat_group'] = "Restriction of the hipchat group"

        configs.each do |key, value|
            puts "Setup value for #{key}: #{value}"
            input_value = STDIN.gets.chomp
            configs[key] = input_value
        end

        list = Configuration.new(configs, File.read("configure.erb"))
        list.save("src/configure.js")
    end
end