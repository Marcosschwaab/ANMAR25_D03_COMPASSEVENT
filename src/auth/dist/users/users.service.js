"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamodb_client_1 = require("../database/dynamodb.client");
let UsersService = class UsersService {
    tableName = 'Users';
    async create(data) {
        const existing = await this.findByEmail(data.email);
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
        }
        const user = {
            id: (0, uuid_1.v4)(),
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 10),
            phone: data.phone,
            profileImageUrl: data.profileImageUrl || '',
            role: data.role,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await dynamodb_client_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand({
            TableName: this.tableName,
            Item: user,
        }));
        return user;
    }
    async findByEmail(email) {
        const result = await dynamodb_client_1.ddbDocClient.send(new lib_dynamodb_1.ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email },
        }));
        return result.Items?.[0] || null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map