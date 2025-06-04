import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

interface S3BucketStackProps extends cdk.StackProps {

}

export class S3BucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: S3BucketStackProps) {
    super(scope, id, props);

    const s3BucketName = process.env.S3_BUCKET_NAME || `user-profiles-nest-compass${this.account}-${this.region}`;

    const userProfilesNestBucket = new s3.Bucket(this, 'UserProfilesNestBucket', {
      bucketName: s3BucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, 
      enforceSSL: true,
    });

    userProfilesNestBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [userProfilesNestBucket.arnForObjects('*')],
    }));
  
    const lambdaCodePath = path.join(__dirname, '../../lambda.zip');

    const myLambdaFunction = new lambda.Function(this, 'ResizeImageLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(lambdaCodePath),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: userProfilesNestBucket.bucketName,
      },
    });

    userProfilesNestBucket.grantReadWrite(myLambdaFunction);

   
    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'profiles/', 
        suffix: '.jpg',
      }
    );

    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'profiles/',
        suffix: '.png',
      }
    );

    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'profiles/', 
        suffix: '.gif',
      }
    );

    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'events/', 
        suffix: '.jpg',
      }
    );

    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'events/',
        suffix: '.png',
      }
    );

    userProfilesNestBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambdaFunction),
      {
        prefix: 'events/',
        suffix: '.gif',
      }
    );

    new cdk.CfnOutput(this, 'BucketName', {
      value: userProfilesNestBucket.bucketName,
      description: 'The name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: myLambdaFunction.functionName,
      description: 'The name of the Lambda function',
    });
  }
}
