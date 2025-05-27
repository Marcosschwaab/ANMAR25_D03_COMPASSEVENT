"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddbDocClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.REGION,
    endpoint: process.env.DYNAMO_ENDPOINT,
    credentials: {
        accessKeyId: 'local-dynamo-key',
        secretAccessKey: 'local-dynamo-secret',
    }
});
exports.ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
//# sourceMappingURL=dynamodb.client.js.map