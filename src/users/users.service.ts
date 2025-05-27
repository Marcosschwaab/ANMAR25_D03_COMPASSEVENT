import { Injectable, ConflictException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_ENDPOINT,
  region: process.env.REGION,
});

@Injectable()
export class UsersService {
  private tableName = 'Users';

  async create(data: any): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already exists');

    const user: User = {
      id: uuidv4(),
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

    await dynamoDb.put({ TableName: this.tableName, Item: user }).promise();
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await dynamoDb.scan({
      TableName: this.tableName,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }).promise();

    return result.Items?.[0] as User || null;
  }
}
