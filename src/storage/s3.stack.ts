import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3BucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3BucketName = process.env.S3_BUCKET_NAME_CDK || `user-profiles-nest-${this.account}-${this.region}`;

    const userProfilesBucket = new s3.Bucket(this, 'UserProfilesNestBucket', {
      bucketName: s3BucketName,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: [],
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
    });

    new cdk.CfnOutput(this, 'BucketNameOutput', {
      value: userProfilesBucket.bucketName,
      description: 'Name of the S3 bucket for user profiles',
      exportName: 'UserProfilesNestBucketName',
    });
  }
}