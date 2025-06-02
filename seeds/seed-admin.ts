import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/users/entities/user.entity';

const dbRegion = process.env.DB_REGION || 'local';
const dbEndpoint = process.env.DB_ENDPOINT || 'http://localhost:8000';
const dbAccessKeyId = process.env.DB_ACCESS_KEY_ID || 'fake';
const dbSecretAccessKey = process.env.DB_SECRET_ACCESS_KEY || 'fake';

const ddbClient = new DynamoDBClient({
  region: dbRegion,
  endpoint: dbEndpoint,
  credentials: {
    accessKeyId: dbAccessKeyId,
    secretAccessKey: dbSecretAccessKey,
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = 'Users';

const seedAdminUser = async () => {
  console.log('🌱 Starting to seed admin user...');

  const adminEmail = 'admin@example.com';
  const adminPassword = 'AdminPassword123';

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const adminUser = {
    id: uuidv4(),
    name: 'Admin User',
    email: adminEmail,
    password: hashedPassword,
    phone: '0000000000',
    profileImageUrl: '',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: adminUser,
      }),
    );
    console.log(`✅ Admin user seeded successfully with email: ${adminEmail}`);
    console.log(`🔑 ID: ${adminUser.id}`);
    console.log('Login with the email and password you set in the script.');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
};

seedAdminUser();