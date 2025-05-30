import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName = process.env.S3_BUCKET_NAME;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
      },
      endpoint: process.env.S3_ENDPOINT || undefined, 
      forcePathStyle: true,
    });
  }

  async uploadImage(file: Express.Multer.File, userId: string): Promise<string> {
    const key = `profiles/${userId}/${randomUUID()}_${file.originalname}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const imageUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      return imageUrl;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException('Image upload failed');
    }
  }
}
