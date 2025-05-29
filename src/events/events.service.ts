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

@Injectable()
export class EventsService {
  private tableName = 'Events';

  async create(data: any, imageUrl: string): Promise<Event> {
    const existing = await this.findByName(data.name);
    if (existing) {
      throw new ConflictException('Event name already exists');
    }

    const event: Event = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      date: data.date,
      imageUrl,
      organizerId: data.organizerId,
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
        FilterExpression: '#n = :name',
        ExpressionAttributeNames: {
          '#n': 'name',
        },
        ExpressionAttributeValues: {
          ':name': name,
        },
      }),
    );

    return result.Items?.[0] as Event || null;
  }

  async findById(id: string): Promise<Event> {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'id = :id',
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
    const now = new Date().toISOString();

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression:
          'SET #n = :n, #d = :d, #dt = :dt, #o = :o, updatedAt = :u',
        ExpressionAttributeNames: {
          '#n': 'name',
          '#d': 'description',
          '#dt': 'date',
          '#o': 'organizerId',
        },
        ExpressionAttributeValues: {
          ':n': updates.name,
          ':d': updates.description,
          ':dt': updates.date,
          ':o': updates.organizerId,
          ':u': now,
        },
      }),
    );
  }

  async softDelete(id: string): Promise<void> {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #s = :s',
        ExpressionAttributeNames: {
          '#s': 'status',
        },
        ExpressionAttributeValues: {
          ':s': 'inactive',
        },
      }),
    );
  }

  async list(
    filters: { name?: string; date?: string; status?: string },
    limit = 10,
    startKey?: any,
  ) {
    let FilterExpression = '';
    const ExpressionAttributeValues: Record<string, any> = {};
    const ExpressionAttributeNames: Record<string, string> = {};

    if (filters.name) {
      FilterExpression += 'contains(#n, :name)';
      ExpressionAttributeNames['#n'] = 'name';
      ExpressionAttributeValues[':name'] = filters.name;
    }

    if (filters.date) {
      FilterExpression += (FilterExpression ? ' AND ' : '') + '#d >= :date';
      ExpressionAttributeNames['#d'] = 'date';
      ExpressionAttributeValues[':date'] = filters.date;
    }

    if (filters.status) {
      FilterExpression += (FilterExpression ? ' AND ' : '') + '#s = :status';
      ExpressionAttributeNames['#s'] = 'status';
      ExpressionAttributeValues[':status'] = filters.status;
    }

    const params: any = {
      TableName: this.tableName,
      Limit: limit,
    };

    if (FilterExpression) {
      params.FilterExpression = FilterExpression;
      params.ExpressionAttributeValues = ExpressionAttributeValues;
      params.ExpressionAttributeNames = ExpressionAttributeNames;
    }

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
