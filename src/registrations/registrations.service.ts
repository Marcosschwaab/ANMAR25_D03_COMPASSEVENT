import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { EventsService } from '../events/events.service';

@Injectable()
export class RegistrationsService {
  private tableName = 'Registrations';

  constructor(private readonly eventsService: EventsService) {}

  async create(eventId: string, participantId: string) {
    const event = await this.eventsService.findById(eventId);

    if (!event || event.status === 'inactive') {
      throw new BadRequestException('Invalid or inactive event');
    }

    const eventDate = new Date(event.date);
    if (eventDate < new Date()) {
      throw new BadRequestException('Event has already occurred');
    }

    const registration = {
      id: uuidv4(),
      eventId,
      participantId,
      createdAt: new Date().toISOString(),
    };

    await ddbDocClient.send(new PutCommand({
      TableName: this.tableName,
      Item: registration,
    }));

    return registration;
  }

  async findAllByParticipant(participantId: string, limit = 10, startKey?: any) {
    const result = await ddbDocClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'participantId = :p AND attribute_not_exists(deletedAt)',
      ExpressionAttributeValues: {
        ':p': participantId,
      },
      Limit: limit,
      ExclusiveStartKey: startKey,
    }));

    return {
      items: result.Items,
      nextPageToken: result.LastEvaluatedKey,
    };
  }

  async softDelete(id: string, participantId: string) {
    const result = await ddbDocClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'id = :id AND participantId = :pid',
      ExpressionAttributeValues: {
        ':id': id,
        ':pid': participantId,
      },
    }));

    const registration = result.Items?.[0];
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await ddbDocClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'SET deletedAt = :d',
      ExpressionAttributeValues: {
        ':d': new Date().toISOString(),
      },
    }));

    return { message: 'Registration cancelled' };
  }
}
