import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { EventsService } from '../events/events.service';
import { FilterRegistrationDto } from './dto/filter-registration.dto';

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

  async findAllByParticipant(participantId: string, filterDto: FilterRegistrationDto) {
    const { limit = 10 } = filterDto; // Extrai apenas o limit do DTO

    if (!participantId) {
      throw new BadRequestException('Participant ID is required.');
    }

    // A expressão de filtro agora considera apenas o participantId e se não foi 'soft-deleted'
    const filterExpression = 'participantId = :p AND attribute_not_exists(deletedAt)';
    const expressionAttributeValues: { [key: string]: any } = {
      ':p': participantId,
    };

    const result = await ddbDocClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit, // Aplica o limite para paginação
    }));

    return {
      items: result.Items,
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