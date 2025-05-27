import { Injectable, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';

@Injectable()
export class UsersService {
  private tableName = 'Users';

  async create(data: any): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

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

    await ddbDocClient.send(new PutCommand({
      TableName: this.tableName,
      Item: user,
    }));

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await ddbDocClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    return result.Items?.[0] as User || null;
  }
}
