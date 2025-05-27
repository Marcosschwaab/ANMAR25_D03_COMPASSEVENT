import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);

  private client = new DynamoDBClient({
    region: process.env.REGION,
    endpoint: process.env.DYNAMO_ENDPOINT,
  });

  async onModuleInit() {
    try {
      const result = await this.client.send(new ListTablesCommand({}));
      this.logger.log(`✅ Connected to DynamoDB. Tables: ${result.TableNames?.join(', ') || 'None'}`);
    } catch (error) {
      this.logger.error(`❌ Failed to connect to DynamoDB: ${error.message}`);
    }
  }
}
