import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.REGION,
  endpoint: process.env.DYNAMO_ENDPOINT,
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);
