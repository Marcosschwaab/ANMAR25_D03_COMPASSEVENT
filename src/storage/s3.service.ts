import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName = process.env.S3_BUCKET_NAME_COMPLETE || 'anmar-users-bucket';

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
        sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
      },
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: true,
    });
  }

  async uploadImage(file: Express.Multer.File, entityId: string, pathPrefix: string = 'general'): Promise<string> {
    const prefix = pathPrefix && !pathPrefix.endsWith('/') ? `${pathPrefix}/` : pathPrefix;
    const key = `${prefix}${entityId}/${randomUUID()}_${file.originalname}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      let imageUrl: string;
      if (process.env.S3_ENDPOINT) {
        const endpointUrl = process.env.S3_ENDPOINT.endsWith('/') ? process.env.S3_ENDPOINT : `${process.env.S3_ENDPOINT}/`;
        imageUrl = `${endpointUrl}${this.bucketName}/${key}`;
      } else {
        imageUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      }
      return imageUrl;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('Image upload failed');
    }
  }

  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.s3.send(new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      }));
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new InternalServerErrorException('Failed to copy S3 object');
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new InternalServerErrorException('Failed to delete S3 object');
    }
  }
}