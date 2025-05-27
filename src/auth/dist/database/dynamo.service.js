"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DynamoDBService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBService = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
let DynamoDBService = DynamoDBService_1 = class DynamoDBService {
    logger = new common_1.Logger(DynamoDBService_1.name);
    client = new client_dynamodb_1.DynamoDBClient({
        region: process.env.REGION,
        endpoint: process.env.DYNAMO_ENDPOINT,
    });
    async onModuleInit() {
        try {
            const result = await this.client.send(new client_dynamodb_1.ListTablesCommand({}));
            this.logger.log(`✅ Connected to DynamoDB. Tables: ${result.TableNames?.join(', ') || 'None'}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to connect to DynamoDB: ${error.message}`);
        }
    }
};
exports.DynamoDBService = DynamoDBService;
exports.DynamoDBService = DynamoDBService = DynamoDBService_1 = __decorate([
    (0, common_1.Injectable)()
], DynamoDBService);
//# sourceMappingURL=dynamo.service.js.map