import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class S3BucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3BucketName = process.env.S3_BUCKET_NAME || `user-profiles-compass-${this.account}-${this.region}`;

    const imageResizerLambda = new lambda.Function(this, 'ImageResizerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda.zip')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new cdk.aws_iam.PolicyStatement({
          actions: ['s3:GetObject', 's3:PutObject'],
          resources: [`arn:aws:s3:::${s3BucketName}/*`],
        }),
      ],
    });

    const userProfilesCfnBucket = new s3.CfnBucket(this, 'UserProfilesNestCfnBucket', {
      bucketName: s3BucketName,
      publicAccessBlockConfiguration: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      },
      corsConfiguration: {
        corsRules: [
          {
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
          },
        ],
      },
      tags: [{ key: 'Name', value: s3BucketName }],
    });

    userProfilesCfnBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);


    new s3.CfnBucketPolicy(this, 'UserProfilesBucketPolicy', {
      bucket: userProfilesCfnBucket.bucketName!,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*', 
            Action: 's3:GetObject', 

            Resource: cdk.Fn.join('', [userProfilesCfnBucket.attrArn, '/*']),
          },
        ],
      },
    });

    const lambdaConfigurations: s3.CfnBucket.LambdaConfigurationProperty[] = [];
    const prefixes = ['profiles/', 'events/'];
    const suffixes = ['.jpg', '.jpeg', '.png'];

    prefixes.forEach(prefix => {
      suffixes.forEach(suffix => {
        lambdaConfigurations.push({
          event: 's3:ObjectCreated:*',
          function: imageResizerLambda.functionArn,
          filter: {
            s3Key: {
              rules: [
                { name: 'prefix', value: prefix },
                { name: 'suffix', value: suffix }
              ]
            }
          }
        });

        new lambda.CfnPermission(this, `S3InvokeLambdaPermission-${prefix.replace('/', '')}-${suffix.replace('.', '')}`, {
          action: 'lambda:InvokeFunction',
          functionName: imageResizerLambda.functionName,
          principal: 's3.amazonaws.com',
          sourceArn: `arn:aws:s3:::${s3BucketName}`,
          sourceAccount: cdk.Stack.of(this).account,
        });
      });
    });

    userProfilesCfnBucket.notificationConfiguration = {
      lambdaConfigurations: lambdaConfigurations,
    };

    userProfilesCfnBucket.node.addDependency(imageResizerLambda);

    new cdk.CfnOutput(this, 'BucketNameOutput', {
      value: userProfilesCfnBucket.bucketName!,
      description: 'Name of the S3 bucket for user profiles and event images',
      exportName: 'UserProfilesNestBucketName',
    });
  }
}