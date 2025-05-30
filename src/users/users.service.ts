import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { UpdateUserDto } from './dto/update-user.dto';

export interface PaginatedUsersResult {
  items: Omit<User, 'password'>[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage?: number;
    totalPages?: number;
    currentPage?: number;
  };
}

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

  async list(
    filters: { name?: string; email?: string; role?: string },
    requestingUserRole: UserRole,
    page?: number,
    limit?: number,
  ): Promise<PaginatedUsersResult> {
    const filterExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (requestingUserRole === UserRole.ORGANIZER) {
      filterExpressions.push('#r = :roleForOrganizer');
      attributeValues[':roleForOrganizer'] = UserRole.PARTICIPANT;
      expressionAttributeNames['#r'] = 'role';
    } else if (requestingUserRole === UserRole.ADMIN) {
      if (filters.role) {
        filterExpressions.push('#r = :roleFromFilter');
        attributeValues[':roleFromFilter'] = filters.role;
        expressionAttributeNames['#r'] = 'role';
      }
    }
    
    if (filters.name) {
      filterExpressions.push('contains(#n, :name)');
      attributeValues[':name'] = filters.name;
      expressionAttributeNames['#n'] = 'name';
    }

    if (filters.email) {
      filterExpressions.push('contains(#e, :email)');
      attributeValues[':email'] = filters.email;
      expressionAttributeNames['#e'] = 'email';
    }

    filterExpressions.push('attribute_not_exists(deletedAt)');

    const scanParams: ScanCommandInput = {
      TableName: this.tableName,
    };

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
    }
    if (Object.keys(attributeValues).length > 0) {
      scanParams.ExpressionAttributeValues = attributeValues;
    }
    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    let allItems: any[] = [];
    let lastEvaluatedKey;
    do {
      const currentScanParams = { ...scanParams };
      if (lastEvaluatedKey) {
        currentScanParams.ExclusiveStartKey = lastEvaluatedKey;
      }
      const command = new ScanCommand(currentScanParams);
      const result = await ddbDocClient.send(command);
      if (result.Items) {
        allItems = allItems.concat(result.Items);
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const usersWithoutPassword = allItems.map((u) => {
      const { password, ...user } = u;
      return user;
    });

    const totalItems = usersWithoutPassword.length;

    if (page && limit && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const paginatedItems = usersWithoutPassword.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        items: paginatedItems,
        meta: {
          totalItems,
          itemCount: paginatedItems.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
      };
    }

    return {
      items: usersWithoutPassword,
      meta: {
        totalItems,
        itemCount: totalItems,
        itemsPerPage: totalItems > 0 ? totalItems : undefined,
        totalPages: 1,
        currentPage: 1,
      },
    };
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
    
    if (data.profileImageUrl) {
        updateFields.push('#piu = :profileImageUrl');
        attributeNames['#piu'] = 'profileImageUrl';
        attributeValues[':profileImageUrl'] = data.profileImageUrl;
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