import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config'; 

@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);
  private client: DynamoDBClient; 

  constructor(private configService: ConfigService) { 

    const region = this.configService.get<string>('DYNAMO_REGION', 'local');
    const endpoint = this.configService.get<string>('DYNAMO_ENDPOINT', 'http://localhost:8000');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID', 'fakeAccessKey');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', 'fakeSecretKey');

    this.client = new DynamoDBClient({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  async onModuleInit() {
    try {
      const result = await this.client.send(new ListTablesCommand({}));
      this.logger.log(`✅ Connected to DynamoDB. Tables: ${result.TableNames?.join(', ') || 'None'}`);
    } catch (error) {
      this.logger.error(`❌ Failed to connect to DynamoDB: ${error.message}`);
    }
  }
}