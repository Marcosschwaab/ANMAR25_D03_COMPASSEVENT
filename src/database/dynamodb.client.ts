import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.DYNAMO_REGION || 'local';
const endpoint = process.env.DYNAMO_ENDPOINT || 'http://localhost:8000';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'fake'; 
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'fake';

export const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: region,
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  }),
);