import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);

  private client = new DynamoDBClient({
    region: 'local',
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'fakeAccessKey',     
      secretAccessKey: 'fakeSecretKey', 
    },
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
