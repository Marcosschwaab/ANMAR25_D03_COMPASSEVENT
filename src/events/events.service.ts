import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Event } from './entities/event.entity';
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private tableName = 'Events';

  async create(eventDto: CreateEventDto, organizerId: string, imageUrl: string): Promise<Event> {
    const existing = await this.findByName(eventDto.name);
    if (existing) {
      throw new ConflictException('Event name already exists');
    }

    const event: Event = {
      id: uuidv4(),
      name: eventDto.name,
      description: eventDto.description,
      date: eventDto.date,
      imageUrl,
      organizerId: organizerId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: event,
      }),
    );

    return event;
  }

  async findByName(name: string): Promise<Event | null> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#n = :name AND attribute_not_exists(deletedAt) AND #s <> :inactiveStatus',
        ExpressionAttributeNames: {
          '#n': 'name',
          '#s': 'status',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':inactiveStatus': 'inactive',
        },
      }),
    );

    return result.Items?.[0] as Event || null;
  }

  async findById(id: string): Promise<Event> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'id = :id AND attribute_not_exists(deletedAt)',
        ExpressionAttributeValues: {
          ':id': id,
        },
      }),
    );

    const event = result.Items?.[0] as Event;
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, updates: Partial<Event>): Promise<void> {
    const eventToUpdate = await this.findById(id);
    if (!eventToUpdate) {
        throw new NotFoundException('Event not found, cannot update.');
    }

    const now = new Date().toISOString();
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.name !== undefined) {
        updateExpressionParts.push('#n = :n');
        expressionAttributeNames['#n'] = 'name';
        expressionAttributeValues[':n'] = updates.name;
    }
    if (updates.description !== undefined) {
        updateExpressionParts.push('#d = :d');
        expressionAttributeNames['#d'] = 'description';
        expressionAttributeValues[':d'] = updates.description;
    }
    if (updates.date !== undefined) {
        updateExpressionParts.push('#dt = :dt');
        expressionAttributeNames['#dt'] = 'date';
        expressionAttributeValues[':dt'] = updates.date;
    }
    if (updates.organizerId !== undefined) {
        updateExpressionParts.push('#o = :o');
        expressionAttributeNames['#o'] = 'organizerId';
        expressionAttributeValues[':o'] = updates.organizerId;
    }
    if (updates.imageUrl !== undefined) {
        updateExpressionParts.push('#iu = :iu');
        expressionAttributeNames['#iu'] = 'imageUrl';
        expressionAttributeValues[':iu'] = updates.imageUrl;
    }
     if (updates.status !== undefined) {
        updateExpressionParts.push('#s = :s');
        expressionAttributeNames['#s'] = 'status';
        expressionAttributeValues[':s'] = updates.status;
    }

    if (updateExpressionParts.length === 0) {
        return;
    }

    updateExpressionParts.push('updatedAt = :u');
    expressionAttributeValues[':u'] = now;

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "UPDATED_NEW",
      }),
    );
  }

  async softDelete(id: string): Promise<void> {
    const eventToDelete = await this.findById(id);
    if (!eventToDelete) {
        throw new NotFoundException('Event not found, cannot delete.');
    }

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #s = :s, deletedAt = :da',
        ExpressionAttributeNames: {
          '#s': 'status',
        },
        ExpressionAttributeValues: {
          ':s': 'inactive',
          ':da': new Date().toISOString(),
        },
      }),
    );
  }

  async list(
    filters: { name?: string; date?: string; status?: string },
    limit = 10,
    startKey?: any,
  ) {
    let FilterExpression = 'attribute_not_exists(deletedAt)';
    const ExpressionAttributeValues: Record<string, any> = {};
    const ExpressionAttributeNames: Record<string, string> = {};

    if (filters.name) {
      FilterExpression += ' AND contains(#n, :name)';
      ExpressionAttributeNames['#n'] = 'name';
      ExpressionAttributeValues[':name'] = filters.name;
    }

    if (filters.date) {
      FilterExpression += ' AND #d >= :date';
      ExpressionAttributeNames['#d'] = 'date';
      ExpressionAttributeValues[':date'] = filters.date;
    }

    if (filters.status) {
      FilterExpression += ' AND #s = :status';
      ExpressionAttributeNames['#s'] = 'status';
      ExpressionAttributeValues[':status'] = filters.status;
    } else {
      FilterExpression += ' AND #s = :activeStatus';
      ExpressionAttributeNames['#s'] = 'status';
      ExpressionAttributeValues[':activeStatus'] = 'active';
    }

    const params: any = {
      TableName: this.tableName,
      Limit: limit,
      FilterExpression: FilterExpression,
      ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
      ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
    };

    if (startKey) {
      params.ExclusiveStartKey = startKey;
    }

    const result = await ddbDocClient.send(new ScanCommand(params));

    return {
      items: result.Items,
      nextPageToken: result.LastEvaluatedKey,
    };
  }
}