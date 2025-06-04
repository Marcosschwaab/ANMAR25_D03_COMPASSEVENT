import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3BucketStack } from '../src/storage/s3.stack'; 
const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new S3BucketStack(app, 'MyS3BucketStackCompassEvent', {

  stackName: 'CompassEventS3Stack-bucket' 
});

app.synth();