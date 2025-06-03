# COMPASS EVENT API

This project provides a robust API for managing events, user registrations, and authentication, built with NestJS. It includes features like role-based access control, email notifications, and integration with AWS services like DynamoDB for data storage and S3 for image management.

## Features

* **User Management:**
    * CRUD operations for users.
    * Support for different user roles: `admin`, `organizer`, and `participant`.
    * Email verification process for new user registrations.
    * Profile image upload integration with AWS S3.
* **Authentication & Authorization:**
    * User login with JWT (JSON Web Tokens) for secure access.
    * Role-based access control implemented using NestJS Guards and custom decorators.
* **Event Management:**
    * CRUD operations for events.
    * Ability to upload event images to AWS S3.
    * Events can have `active` or `inactive` statuses.
    * Organizers and Admins have specific permissions for event management.
* **Event Registration:**
    * Users can register for events.
    * Soft deletion (cancellation) of registrations.
* **Email Notifications:**
    * Sends emails for various actions such as user creation (verification), event creation, registration creation, and account/event deletion using AWS SES.
* **Data Storage:**
    * Uses AWS DynamoDB as the primary database for storing user, event, and registration data.
* **API Documentation:**
    * Integrated Swagger UI for comprehensive API documentation.
* **Validation:**
    * Uses global validation pipes for DTOs and custom pipes for UUIDs, image files, and roles.

## Technologies Used

* **Framework:** NestJS
* **Language:** TypeScript
* **Database:** AWS DynamoDB
* **Cloud Services:** AWS S3 (for image storage), AWS SES (for email notifications)
* **Authentication:** JWT (JSON Web Tokens), Bcrypt (for password hashing)
* **Validation:** `class-validator`, `class-transformer`
* **API Documentation:** Swagger (OpenAPI)
* **Containerization:** Docker (for local DynamoDB)
* **Infrastructure as Code:** AWS CDK (for S3 bucket deployment)

### Dependencies

* `@aws-sdk/client-dynamodb`: `^3.817.0`
* `@aws-sdk/client-s3`: `^3.820.0`
* `@aws-sdk/client-ses`: `^3.821.0`
* `@aws-sdk/lib-dynamodb`: `^3.817.0`
* `@aws-sdk/s3-request-presigner`: `^3.820.0`
* `@nestjs/common`: `^11.0.1`
* `@nestjs/config`: `^4.0.2`
* `@nestjs/core`: `^11.0.1`
* `@nestjs/jwt`: `^11.0.0`
* `@nestjs/passport`: `^11.0.5`
* `@nestjs/platform-express`: `^11.0.1`
* `@nestjs/swagger`: `^11.2.0`
* `aws-cdk-lib`: `^2.199.0`
* `bcrypt`: `^6.0.0`
* `class-transformer`: `^0.5.1`
* `class-validator`: `^0.14.2`
* `constructs`: `^10.4.2`
* `express`: `^5.1.0`
* `multer`: `^2.0.0`
* `multer-s3`: `^3.0.1`
* `passport`: `^0.7.0`
* `passport-jwt`: `^4.0.1`
* `reflect-metadata`: `^0.2.2`
* `rxjs`: `^7.8.1`

### Development Dependencies

* `@eslint/eslintrc`: `^3.2.0`
* `@eslint/js`: `^9.18.0`
* `@nestjs/cli`: `^11.0.0`
* `@nestjs/schematics`: `^11.0.0`
* `@nestjs/testing`: `^11.0.1`
* `@swc/cli`: `^0.6.0`
* `@swc/core`: `^1.10.7`
* `@types/bcrypt`: `^5.0.2`
* `@types/express`: `^5.0.2`
* `@types/jest`: `^29.5.14`
* `@types/multer`: `^1.4.12`
* `@types/node`: `^22.15.29`
* `@types/supertest`: `^6.0.2`
* `@types/uuid`: `^10.0.0`
* `aws-cdk`: `^2.1017.1`
* `eslint`: `^9.18.0`
* `eslint-config-prettier`: `^10.0.1`
* `eslint-plugin-prettier`: `^5.2.2`
* `globals`: `^16.0.0`
* `jest`: `^29.7.0`
* `prettier`: `^3.4.2`
* `source-map-support`: `^0.5.21`
* `supertest`: `^7.0.0`
* `ts-jest`: `^29.2.5`
* `ts-loader`: `^9.5.2`
* `ts-node`: `^10.9.2`
* `tsconfig-paths`: `^4.2.0`
* `typescript`: `^5.8.3`
* `typescript-eslint`: `^8.20.0`

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

* Node.js (LTS version recommended)
* npm (Node Package Manager)
* Docker and Docker Compose
* AWS CLI (configured with appropriate credentials for S3 and SES if deploying to AWS or running seeds)

### Environment Variables

Create a `.env` file in the root directory of the project and populate it with the following environment variables. Replace placeholder values with your actual configurations.

```

PORT=3000
JWT\_SECRET=your\_super\_secret\_jwt\_key
JWT\_EXPIRATION\_TIME=3600s \# e.g., 1h, 7d

# AWS Credentials (if using real AWS services or for seeding)

AWS\_ACCESS\_KEY\_ID=YOUR\_AWS\_ACCESS\_KEY\_ID
AWS\_SECRET\_ACCESS\_KEY=YOUR\_AWS\_SECRET\_ACCESS\_KEY
AWS\_REGION=us-east-1 \# e.g., us-east-1

# AWS SES Configuration

AWS\_SES\_MAIL\_FROM=no-reply@yourdomain.com \# Must be a verified email in SES
AWS\_SESSION\_TOKEN= \# Optional, if using temporary credentials

# AWS S3 Configuration

S3\_BUCKET\_NAME=your-s3-bucket-name \# Used by the application
S3\_ENDPOINT= \# Optional, e.g., for localstack or custom S3 endpoint (http://localhost:4566)
DEFAULT\_EVENT\_IMAGE\_URL=[https://default-event-image.com/placeholder.png](https://www.google.com/search?q=https://default-event-image.com/placeholder.png) \# Default image for events

# AWS CDK S3 Bucket Name (for CDK deployment)

S3\_BUCKET\_NAME\_CDK=user-profiles-nest-youraccountid-yourregion

# DynamoDB Configuration

DYNAMO\_REGION=local \# or your AWS region
DYNAMO\_ENDPOINT=http://localhost:8000 \# For local DynamoDB, otherwise remove
APP\_URL=http://localhost:3000 \# Base URL for email verification links

````

### 1. Run DynamoDB Local with Docker Compose

This command will start a local DynamoDB instance using Docker.
```bash
docker-compose -f ./docker/docker-compose.yml up -d
````

### 2\. Create DynamoDB Tables

Execute these commands to create the necessary tables in your DynamoDB instance (local or remote, adjust `--endpoint-url` and `--region` as needed).

```bash
aws dynamodb create-table \
--table-name Users \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--billing-mode PAY_PER_REQUEST \
--region local \
--endpoint-url http://localhost:8000

aws dynamodb create-table \
--table-name Events \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--billing-mode PAY_PER_REQUEST \
--region local \
--endpoint-url http://localhost:8000

aws dynamodb create-table \
--table-name Registrations \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--billing-mode PAY_PER_REQUEST \
--region local \
--endpoint-url http://localhost:8000
```

### 3\. List DynamoDB Tables (Verification)

To verify that the tables were created successfully:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### 4\. Seed the Database

This command will seed the database with an admin user. The default admin email is `admin@example.com`.

```bash
npm run db:seed:admin
```

### 5\. Deploy AWS S3 Bucket (Optional, using AWS CDK)

If you plan to use a dedicated S3 bucket in AWS, you can deploy it using AWS CDK. Ensure you have the AWS CDK CLI installed and configured.

  * **Synthesize CloudFormation template:**
    ```bash
    npx aws-cdk synth
    ```
  * **Deploy the S3 bucket:**
    ```bash
    npx aws-cdk deploy
    ```
    You might need to confirm the deployment.

### 6\. Install Dependencies

Navigate to the project root and install all required Node.js dependencies:

```bash
npm install
```

### 7\. Run the Application

Start the NestJS application:

```bash
npm run start:dev
```

The application will usually run on `http://localhost:3000` (or the `PORT` specified in your `.env` file).

## API Endpoints

The API includes the following endpoints. Base URL for all endpoints is `http://localhost:3000/api/v1`.

### General Endpoints

#### GET `/api/v1`

  * **Summary:** Basic "Hello World\!" endpoint.
  * **Description:** Returns a simple greeting message.
  * **Roles:** Public (No authentication required).
  * **Response Example:**
    ```
    "Hello World!"
    ```

### Authentication Endpoints (`/api/v1/auth`)

#### POST `/api/v1/auth/login`

  * **Summary:** User login.
  * **Description:** Authenticates a user with email and password, returning a JWT token upon success.
  * **Roles:** Public.
  * **Request Body Example:**
    ```json
    {
      "email": "admin@example.com",
      "password": "Password123"
    }
    ```
  * **Response Example (Success):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5c2VyIjoiSldUIn0..."
    }
    ```
  * **Response Example (Failure - 401 Unauthorized):**
    ```json
    {
      "statusCode": 401,
      "message": "Invalid email or password"
    }
    ```

#### GET `/api/v1/auth/verify-email`

  * **Summary:** Verify user email with a token.
  * **Description:** Activates a user account using a verification token sent to their email.
  * **Roles:** Public.
  * **Query Parameters:**
      * `token` (string, UUID format): The verification token (user ID).
  * **Request Example:**
    ```
    GET /api/v1/auth/verify-email?token=550e8400-e29b-41d4-a716-446655440000
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "message": "Email successfully verified. You can now log in."
    }
    ```
  * **Response Example (Already Active - 200 OK):**
    ```json
    {
      "message": "Email already verified."
    }
    ```
  * **Response Example (Failure - 401 Unauthorized):**
    ```json
    {
      "statusCode": 401,
      "message": "Invalid or expired verification token."
    }
    ```

### User Endpoints (`/api/v1/users`)

#### POST `/api/v1/users`

  * **Summary:** Create a new user.
  * **Description:** Registers a new user with name, email, password, phone, and role. Supports optional profile image upload. If email service is configured, sends a verification email.
  * **Roles:** Public.
  * **Request Body Example (multipart/form-data):**
    ```
    name: John Doe
    email: john.doe@example.com
    password: Password123
    phone: +1234567890
    role: participant
    file: (binary file)
    ```
  * **Response Example (Success - 201 Created, password excluded):**
    ```json
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "profileImageUrl": "[https://your-s3-bucket.s3.amazonaws.com/profiles/550e8400-e29b-41d4-a716-446655440000/some-image.jpg](https://your-s3-bucket.s3.amazonaws.com/profiles/550e8400-e29b-41d4-a716-446655440000/some-image.jpg)",
      "role": "participant",
      "isActive": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 409 Conflict):**
    ```json
    {
      "statusCode": 409,
      "message": "Email already exists"
    }
    ```

#### GET `/api/v1/users/:id`

  * **Summary:** Find a user by ID.
  * **Description:** Retrieves a user's details by their UUID. Only the user themselves or an Admin can access this.
  * **Roles:** Authenticated (User's own ID or Admin).
  * **Path Parameters:**
      * `id` (string, UUID format): The user's unique identifier.
  * **Request Example:**
    ```
    GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
    ```
  * **Response Example (Success - 200 OK, password excluded):**
    ```json
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "profileImageUrl": "[https://example.com/profile.jpg](https://example.com/profile.jpg)",
      "role": "participant",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "Access denied"
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "User with ID \"<id>\" not found."
    }
    ```

#### PATCH `/api/v1/users/:id`

  * **Summary:** Update a user's details.
  * **Description:** Updates an existing user's information (name, email, password, phone, profile image). Only the user themselves or an Admin can update.
  * **Roles:** Authenticated (User's own ID or Admin).
  * **Path Parameters:**
      * `id` (string, UUID format): The user's unique identifier.
  * **Request Body Example (multipart/form-data):**
    ```
    name: Jane Doe (Optional)
    email: jane.doe@example.com (Optional)
    password: NewPass123 (Optional)
    phone: +1987654321 (Optional)
    file: (binary file - Optional)
    ```
  * **Response Example (Success - 200 OK, returns updated user, password excluded):**
    ```json
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+1987654321",
      "profileImageUrl": "[https://your-s3-bucket.s3.amazonaws.com/profiles/550e8400-e29b-41d4-a716-446655440000/new-image.jpg](https://your-s3-bucket.s3.amazonaws.com/profiles/550e8400-e29b-41d4-a716-446655440000/new-image.jpg)",
      "role": "participant",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-02T12:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "You can only update your own data or an admin can update any user."
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "User with ID \"<id>\" not found."
    }
    ```
  * **Response Example (Failure - 409 Conflict):**
    ```json
    {
      "statusCode": 409,
      "message": "Email already in use by another user."
    }
    ```

#### DELETE `/api/v1/users/:id`

  * **Summary:** Soft delete a user account.
  * **Description:** Marks a user account as deleted and inactive. Only the account owner or an Admin can perform this action.
  * **Roles:** Authenticated (User's own ID or Admin).
  * **Path Parameters:**
      * `id` (string, UUID format): The user's unique identifier.
  * **Request Example:**
    ```
    DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "message": "User soft deleted successfully"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "Only admin or the account owner can delete"
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "User with ID \"<id>\" not found."
    }
    ```

#### GET `/api/v1/users`

  * **Summary:** List users with filters and pagination.
  * **Description:** Retrieves a paginated list of users. Organizers can only see participants. Admins can filter by any role.
  * **Roles:** `admin`, `organizer`.
  * **Query Parameters:**
      * `name` (string, optional): Filter by user name.
      * `email` (string, optional): Filter by user email.
      * `role` (enum: `admin`, `organizer`, `participant`, optional): Filter by user role.
      * `page` (number, optional, default: 1): Page number for pagination.
      * `limit` (number, optional, default: 10): Number of items per page.
  * **Request Example:**
    ```
    GET /api/v1/users?role=participant&page=1&limit=5
    ```
  * **Response Example (Success - 200 OK, password excluded):**
    ```json
    {
      "items": [
        {
          "id": "uuid-participant-1",
          "name": "Participant One",
          "email": "participant1@example.com",
          "phone": "+1112223333",
          "profileImageUrl": "",
          "role": "participant",
          "isActive": true,
          "createdAt": "2023-01-01T00:00:00.000Z",
          "updatedAt": "2023-01-01T00:00:00.000Z"
        }
      ],
      "meta": {
        "totalItems": 1,
        "itemCount": 1,
        "itemsPerPage": 5,
        "totalPages": 1,
        "currentPage": 1
      }
    }
    ```

### Event Endpoints (`/api/v1/events`)

#### POST `/api/v1/events`

  * **Summary:** Create a new event.
  * **Description:** Creates a new event with an optional image. The organizer ID is automatically assigned based on the authenticated user.
  * **Roles:** `admin`, `organizer`.
  * **Request Body Example (multipart/form-data):**
    ```
    name: Node.js Bootcamp 2025
    description: An immersive event about Node.js and NestJS.
    date: 2025-12-01T10:00:00.000Z
    file: (binary file - Optional)
    ```
  * **Response Example (Success - 201 Created):**
    ```json
    {
      "id": "b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3",
      "name": "Node.js Bootcamp 2025",
      "description": "An immersive event about Node.js and NestJS.",
      "date": "2025-12-01T10:00:00.000Z",
      "imageUrl": "[https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/event-image.jpg](https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/event-image.jpg)",
      "organizerId": "organizer-uuid",
      "status": "active",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 409 Conflict):**
    ```json
    {
      "statusCode": 409,
      "message": "Event name already exists"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "User ID not found in request. User may not be properly authenticated."
    }
    ```

#### PATCH `/api/v1/events/:id`

  * **Summary:** Update an event.
  * **Description:** Updates an existing event's details. Only the organizer of the event or an Admin can update.
  * **Roles:** `admin`, `organizer`.
  * **Path Parameters:**
      * `id` (string, UUID format): The event's unique identifier.
  * **Request Body Example (multipart/form-data):**
    ```
    name: Updated Event Name (Optional)
    description: Updated description for the event. (Optional)
    date: 2025-12-15T10:00:00.000Z (Optional)
    file: (binary file - Optional)
    ```
  * **Response Example (Success - 200 OK, returns updated event):**
    ```json
    {
      "id": "b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3",
      "name": "Updated Event Name",
      "description": "Updated description for the event.",
      "date": "2025-12-15T10:00:00.000Z",
      "imageUrl": "[https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/new-event-image.jpg](https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/new-event-image.jpg)",
      "organizerId": "organizer-uuid",
      "status": "active",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-02T12:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "Forbidden: You are not the organizer of this event or an administrator."
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "Event not found"
    }
    ```

#### GET `/api/v1/events`

  * **Summary:** List events with filters and pagination.
  * **Description:** Retrieves a paginated list of events. Filters can be applied by name, date (from), and status. By default, lists active and non-deleted events.
  * **Roles:** Authenticated (Any role).
  * **Query Parameters:**
      * `name` (string, optional): Filter by part of the event name.
      * `date` (string, optional, ISO date string): Filter events occurring from this date onwards.
      * `status` (enum: `active`, `inactive`, optional): Filter by event status.
      * `limit` (number, optional, default: 10): Number of events per page.
      * `startKey` (string, optional): Token for the next page of results (DynamoDB `ExclusiveStartKey`).
  * **Request Example:**
    ```
    GET /api/v1/events?name=Bootcamp&date=2025-01-01&status=active&limit=5
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "items": [
        {
          "id": "event-uuid-1",
          "name": "Another Bootcamp",
          "description": "Description.",
          "date": "2025-02-01T10:00:00.000Z",
          "imageUrl": "[https://example.com/image1.jpg](https://example.com/image1.jpg)",
          "organizerId": "organizer-uuid",
          "status": "active",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "updatedAt": "2023-01-01T00:00:00.000Z"
        }
      ],
      "nextPageToken": {
        "id": "last-evaluated-key-uuid"
      }
    }
    ```

#### GET `/api/v1/events/:id`

  * **Summary:** Find an event by ID.
  * **Description:** Retrieves event details by its UUID.
  * **Roles:** Authenticated (Any role).
  * **Path Parameters:**
      * `id` (string, UUID format): The event's unique identifier.
  * **Request Example:**
    ```
    GET /api/v1/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "id": "b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3",
      "name": "Node.js Bootcamp 2025",
      "description": "An immersive event about Node.js and NestJS.",
      "date": "2025-12-01T10:00:00.000Z",
      "imageUrl": "[https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/event-image.jpg](https://your-s3-bucket.s3.amazonaws.com/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3/event-image.jpg)",
      "organizerId": "organizer-uuid",
      "status": "active",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "Event not found"
    }
    ```

#### DELETE `/api/v1/events/:id`

  * **Summary:** Soft delete an event.
  * **Description:** Marks an event as `inactive` and `deletedAt`. Only the organizer of the event or an Admin can delete.
  * **Roles:** `admin`, `organizer`.
  * **Path Parameters:**
      * `id` (string, UUID format): The event's unique identifier.
  * **Request Example:**
    ```
    DELETE /api/v1/events/b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "message": "Event soft deleted successfully"
    }
    ```
  * **Response Example (Failure - 403 Forbidden):**
    ```json
    {
      "statusCode": 403,
      "message": "Forbidden: You are not the organizer of this event or an administrator."
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "Event not found"
    }
    ```

### Registration Endpoints (`/api/v1/registrations`)

#### POST `/api/v1/registrations`

  * **Summary:** Create a new event registration.
  * **Description:** Allows a `participant` or `organizer` to create a new registration for an event.
  * **Roles:** `participant`, `organizer`.
  * **Request Body Example:**
    ```json
    {
      "eventId": "b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3"
    }
    ```
  * **Response Example (Success - 201 Created):**
    ```json
    {
      "id": "registration-uuid",
      "eventId": "b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3",
      "participantId": "participant-uuid",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```
  * **Response Example (Failure - 400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "message": "Invalid or inactive event"
    }
    ```
  * **Response Example (Failure - 400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "message": "Event has already occurred"
    }
    ```

#### GET `/api/v1/registrations`

  * **Summary:** List all registrations of the logged-in user.
  * **Description:** Retrieves a list of registrations associated with the authenticated user.
  * **Roles:** `participant`, `organizer`.
  * **Query Parameters:**
      * `limit` (number, optional, default: 10): Limit the number of registrations returned.
  * **Request Example:**
    ```
    GET /api/v1/registrations?limit=5
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "items": [
        {
          "id": "registration-uuid-1",
          "eventId": "event-uuid-1",
          "participantId": "participant-uuid",
          "createdAt": "2023-01-01T00:00:00.000Z"
        },
        {
          "id": "registration-uuid-2",
          "eventId": "event-uuid-2",
          "participantId": "participant-uuid",
          "createdAt": "2023-01-02T00:00:00.000Z"
        }
      ]
    }
    ```

#### DELETE `/api/v1/registrations/:id`

  * **Summary:** Cancel (soft delete) a registration by ID.
  * **Description:** Soft deletes a registration, marking it as cancelled. Only the participant who created the registration can cancel it.
  * **Roles:** `participant`, `organizer`.
  * **Path Parameters:**
      * `id` (string, UUID format): The registration's unique identifier.
  * **Request Example:**
    ```
    DELETE /api/v1/registrations/registration-uuid
    ```
  * **Response Example (Success - 200 OK):**
    ```json
    {
      "message": "Registration cancelled"
    }
    ```
  * **Response Example (Failure - 404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "Registration not found"
    }
    ```

