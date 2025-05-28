import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { UpdateUserDto } from './dto/update-user.dto';

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

    await ddbDocClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: user,
      }),
    );

    return user;
  }
  async list(filters: { name?: string; email?: string; role?: string }) {
  const filterExpressions: string[] = [];
  const attributeValues: Record<string, any> = {};

  if (filters.name) {
    filterExpressions.push('contains(#n, :name)');
    attributeValues[':name'] = filters.name;
  }

  if (filters.email) {
    filterExpressions.push('contains(#e, :email)');
    attributeValues[':email'] = filters.email;
  }

  if (filters.role) {
    filterExpressions.push('#r = :role');
    attributeValues[':role'] = filters.role;
  }

  filterExpressions.push('attribute_not_exists(deletedAt)');

  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeNames: {
        '#n': 'name',
        '#e': 'email',
        '#r': 'role',
      },
      ExpressionAttributeValues: attributeValues,
    }),
  );

  return result.Items?.map((u) => {
    const { password, ...user } = u;
    return user;
  });
}

  async findByEmail(email: string): Promise<User | null> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'email = :email AND attribute_not_exists(deletedAt)',
        ExpressionAttributeValues: {
          ':email': email,
        },
      }),
    );

    return result.Items?.[0] as User || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'id = :id AND attribute_not_exists(deletedAt)',
        ExpressionAttributeValues: {
          ':id': id,
        },
      }),
    );

    return result.Items?.[0] as User || null;
  }

  async update(id: string, data: UpdateUserDto): Promise<void> {
    const updateFields: string[] = [];
    const attributeNames = {};
    const attributeValues = {};

    if (data.name) {
      updateFields.push('#n = :name');
      attributeNames['#n'] = 'name';
      attributeValues[':name'] = data.name;
    }

    if (data.email) {
      updateFields.push('#e = :email');
      attributeNames['#e'] = 'email';
      attributeValues[':email'] = data.email;
    }

    if (data.phone) {
      updateFields.push('#p = :phone');
      attributeNames['#p'] = 'phone';
      attributeValues[':phone'] = data.phone;
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.push('#pw = :password');
      attributeNames['#pw'] = 'password';
      attributeValues[':password'] = hashedPassword;
    }

    updateFields.push('#u = :updatedAt');
    attributeNames['#u'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();

    if (updateFields.length === 0) return;

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateFields.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      }),
    );
  }

  async softDelete(id: string): Promise<void> {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET deletedAt = :deletedAt, isActive = :isActive',
        ExpressionAttributeValues: {
          ':deletedAt': new Date().toISOString(),
          ':isActive': false,
        },
      }),
    );
  }
}

