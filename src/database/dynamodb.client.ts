import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'local',
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fake',
      secretAccessKey: 'fake',
    },
  }),
);
