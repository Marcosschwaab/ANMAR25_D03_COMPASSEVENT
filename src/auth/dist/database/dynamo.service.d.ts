import { OnModuleInit } from '@nestjs/common';
export declare class DynamoDBService implements OnModuleInit {
    private readonly logger;
    private client;
    onModuleInit(): Promise<void>;
}
