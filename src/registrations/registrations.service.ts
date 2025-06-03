import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { EventsService } from '../events/events.service';
import { FilterRegistrationDto } from './dto/filter-registration.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RegistrationsService {
  private tableName = 'Registrations';

  constructor(
    private readonly eventsService: EventsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

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

    const participant = await this.usersService.findById(participantId);
    if (participant) {
      const emailSubject = 'Registration Created Successfully!';
      const emailMessage = `Hello ${participant.name}, your registration for the event "${event.name}" has been successfully created.`;
      const emailHtml = this.emailService.generateGenericNotificationHtml(emailSubject, emailMessage);
      try {
        await this.emailService.sendEmail(participant.email, emailSubject, emailHtml);
      } catch (error) {
        console.error('Failed to send registration creation email:', error);
      }
    }

    return registration;
  }

  async findAllByParticipant(participantId: string, filterDto: FilterRegistrationDto) {
    const { limit = 10 } = filterDto;

    if (!participantId) {
      throw new BadRequestException('Participant ID is required.');
    }

    const filterExpression = 'participantId = :p AND attribute_not_exists(deletedAt)';
    const expressionAttributeValues: { [key: string]: any } = {
      ':p': participantId,
    };

    const result = await ddbDocClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
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

    const event = await this.eventsService.findById(registration.eventId);
    const participant = await this.usersService.findById(participantId);
    if (participant && event) {
      const emailSubject = 'Registration Cancelled';
      const emailMessage = `Hello ${participant.name}, your registration for the event "${event.name}" has been successfully cancelled.`;
      const emailHtml = this.emailService.generateGenericNotificationHtml(emailSubject, emailMessage);
      try {
        await this.emailService.sendEmail(participant.email, emailSubject, emailHtml);
      } catch (error) {
        console.error('Failed to send registration cancellation email:', error);
      }
    }

    return { message: 'Registration cancelled' };
  }
}