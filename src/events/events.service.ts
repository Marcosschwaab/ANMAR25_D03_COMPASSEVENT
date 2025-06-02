import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventStatus } from './entities/event.entity';
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../database/dynamodb.client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { S3Service } from '../storage/s3.service';


@Injectable()
export class EventsService {
  private tableName = 'Events';

  constructor(private readonly s3Service: S3Service) {}

  async create(eventDto: Omit<CreateEventDto, 'file'>, organizerId: string, file?: Express.Multer.File): Promise<Event> {
    const existing = await this.findByName(eventDto.name);
    if (existing) {
      throw new ConflictException('Event name already exists');
    }

    const eventId = uuidv4();
    let imageUrl = process.env.DEFAULT_EVENT_IMAGE_URL || 'https://default-event-image.com/placeholder.png';

    if (file) {
      imageUrl = await this.s3Service.uploadImage(file, eventId, 'events');
    }

    const event: Event = {
      id: eventId,
      name: eventDto.name,
      description: eventDto.description,
      date: eventDto.date,
      imageUrl,
      organizerId: organizerId,
      status: 'active' as EventStatus,
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
          ':inactiveStatus': 'inactive' as EventStatus,
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

  
  async update(id: string, updates: Omit<UpdateEventDto, 'file'>, file?: Express.Multer.File): Promise<Event> {
    const eventToUpdate = await this.findById(id);

    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    let newUploadedImageUrl: string | undefined = undefined;

    if (file) {
      newUploadedImageUrl = await this.s3Service.uploadImage(file, id, 'events');
      if (newUploadedImageUrl !== eventToUpdate.imageUrl) {
        updateExpressionParts.push('#iu = :iu');
        expressionAttributeNames['#iu'] = 'imageUrl';
        expressionAttributeValues[':iu'] = newUploadedImageUrl;
      }
    }

    if (updates.name !== undefined && updates.name !== eventToUpdate.name) {
        updateExpressionParts.push('#n = :n');
        expressionAttributeNames['#n'] = 'name';
        expressionAttributeValues[':n'] = updates.name;
    }
    if (updates.description !== undefined && updates.description !== eventToUpdate.description) {
        updateExpressionParts.push('#d = :d');
        expressionAttributeNames['#d'] = 'description';
        expressionAttributeValues[':d'] = updates.description;
    }
    if (updates.date !== undefined && updates.date !== eventToUpdate.date) {
        updateExpressionParts.push('#dt = :dt');
        expressionAttributeNames['#dt'] = 'date';
        expressionAttributeValues[':dt'] = updates.date;
    }

    if (updateExpressionParts.length === 0) {
         return eventToUpdate;
    }

    updateExpressionParts.push('#ua = :ua');
    expressionAttributeNames['#ua'] = 'updatedAt';
    expressionAttributeValues[':ua'] = new Date().toISOString();

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
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #s = :s, deletedAt = :da, #ua = :ua',
        ExpressionAttributeNames: {
          '#s': 'status',
          '#ua': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':s': 'inactive' as EventStatus,
          ':da': new Date().toISOString(),
          ':ua': new Date().toISOString()
        },
      }),
    );
  }

  async list(
    filters: { name?: string; date?: string; status?: EventStatus },
    limit = 10,
    startKey?: any,
  ) {
    const filterParts: string[] = [];
    const ExpressionAttributeValues: Record<string, any> = {};
    const ExpressionAttributeNames: Record<string, string> = {};

    let statusToFilter = filters.status;
    if (!statusToFilter) {
        filterParts.push('attribute_not_exists(deletedAt)');
        filterParts.push('#s = :statusValue');
        ExpressionAttributeNames['#s'] = 'status';
        ExpressionAttributeValues[':statusValue'] = 'active';
    } else if (statusToFilter === 'active') {
        filterParts.push('attribute_not_exists(deletedAt)');
        filterParts.push('#s = :statusValue');
        ExpressionAttributeNames['#s'] = 'status';
        ExpressionAttributeValues[':statusValue'] = 'active';
    } else if (statusToFilter === 'inactive') {
         filterParts.push('#s = :statusValue');
         ExpressionAttributeNames['#s'] = 'status';
         ExpressionAttributeValues[':statusValue'] = 'inactive';
    }

    if (filters.name) {
      filterParts.push('contains(#filterName, :nameValue)');
      ExpressionAttributeNames['#filterName'] = 'name';
      ExpressionAttributeValues[':nameValue'] = filters.name;
    }

    if (filters.date) {
      filterParts.push('#filterDate >= :dateValue');
      ExpressionAttributeNames['#filterDate'] = 'date';
      ExpressionAttributeValues[':dateValue'] = filters.date;
    }

    const params: any = {
      TableName: this.tableName,
      Limit: limit,
    };

    if (filterParts.length > 0) {
      params.FilterExpression = filterParts.join(' AND ');
    }

    if (Object.keys(ExpressionAttributeValues).length > 0) {
      params.ExpressionAttributeValues = ExpressionAttributeValues;
    }

    if (Object.keys(ExpressionAttributeNames).length > 0 && filterParts.length > 0) {
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