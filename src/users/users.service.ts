import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException
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
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../email/email.service';

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

  constructor(private readonly emailService: EmailService) {}

  async create(data: CreateUserDto, profileImageUrl?: string): Promise<Omit<User, 'password'>> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const isEmailServiceConfigured = this.emailService.isConfigured();

    const user: User = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      phone: data.phone,
      profileImageUrl: profileImageUrl || '',
      role: data.role,
      isActive: isEmailServiceConfigured ? false : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: user,
      }),
    );

    if (isEmailServiceConfigured) {
      const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${user.id}`;
      const emailHtml = this.emailService.generateVerificationEmailHtml(user.name, verificationLink);
      try {
          await this.emailService.sendEmail(user.email, 'Verify Your Email Address', emailHtml);
      } catch (error) {
          console.error('Failed to send verification email:', error);
      }
    } else {
        console.warn(`Email service not configured. Skipping verification email for user: ${user.email}. User is active by default.`);
    }


    const { password, ...result } = user;
    return result;
  }

  async activateUser(id: string): Promise<Omit<User, 'password'>> {
    const userToActivate = await this.findById(id);
    if (!userToActivate) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    if (userToActivate.isActive) {
      throw new BadRequestException('User is already active.');
    }

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isActive': true,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );
    userToActivate.isActive = true;
    userToActivate.updatedAt = new Date().toISOString();
    return userToActivate;
  }

  async list(
    filters: { name?: string; email?: string; role?: UserRole },
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
      attributeValues[':e'] = filters.email;
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

    let allItems: User[] = [];
    let lastEvaluatedKey;
    do {
      const currentScanParams = { ...scanParams };
      if (lastEvaluatedKey) {
        currentScanParams.ExclusiveStartKey = lastEvaluatedKey;
      }
      const command = new ScanCommand(currentScanParams);
      const result = await ddbDocClient.send(command);
      if (result.Items) {
        allItems = allItems.concat(result.Items as User[]);
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
    return (result.Items?.[0] as User) || null;
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'id = :id AND attribute_not_exists(deletedAt)',
        ExpressionAttributeValues: {
          ':id': id,
        },
      }),
    );
    const userEntity = result.Items?.[0] as User;
    if (!userEntity) {
      return null;
    }
    const { password, ...rest } = userEntity;
    return rest;
  }

  async update(id: string, data: Partial<UpdateUserDto & { profileImageUrl?: string }>): Promise<void> {
    const updateFields: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = {};

    const userToUpdate = await this.findById(id);
    if (!userToUpdate) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    let actualDataChanged = false;

    if (data.name && data.name !== userToUpdate.name) {
      updateFields.push('#n = :name');
      attributeNames['#n'] = 'name';
      attributeValues[':name'] = data.name;
      actualDataChanged = true;
    }

    if (data.email && data.email !== userToUpdate.email) {
      const existingByEmail = await this.findByEmail(data.email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Email already in use by another user.');
      }
      updateFields.push('#e = :email');
      attributeNames['#e'] = 'email';
      attributeValues[':e'] = data.email;
      actualDataChanged = true;
    }

 if (data.phone && data.phone !== userToUpdate.phone) {
      updateFields.push('#p = :p'); 
      attributeNames['#p'] = 'phone';
      attributeValues[':p'] = data.phone; 
      actualDataChanged = true;
    }

    if (data.profileImageUrl && data.profileImageUrl !== userToUpdate.profileImageUrl) {
      updateFields.push('#piu = :profileImageUrl');
      attributeNames['#piu'] = 'profileImageUrl';
      attributeValues[':profileImageUrl'] = data.profileImageUrl;
      actualDataChanged = true;
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.push('#pw = :password');
      attributeNames['#pw'] = 'password';
      attributeValues[':password'] = hashedPassword;
      actualDataChanged = true;
    }

    if (!actualDataChanged) {
      return;
    }

    updateFields.push('#u = :updatedAt');
    attributeNames['#u'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateFields.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
        ReturnValues: 'NONE',
      }),
    );
  }

  async softDelete(id: string): Promise<void> {
    const userToDelete = await this.findById(id);
    if (!userToDelete) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
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

    const emailSubject = 'Your Account Has Been Deleted';
    const emailMessage = `Hello ${userToDelete.name}, your account has been successfully deleted. If you did not request this, please contact us.`;
    const emailHtml = this.emailService.generateGenericNotificationHtml(emailSubject, emailMessage);

    try {
        await this.emailService.sendEmail(userToDelete.email, emailSubject, emailHtml);
    } catch (error) {
        console.error('Failed to send account deletion email:', error);
    }
  }
}