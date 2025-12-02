# TutorLink Backend API

Backend API for TutorLink - AI-Powered Peer Tutoring & Study Planner platform.

## Features

- RESTful API with Express.js
- MySQL database integration
- JWT-based authentication
- Role-based access control (Student, Tutor, Admin)
- Comprehensive error handling and logging
- Rate limiting and security middleware
- Cloud-ready deployment configuration

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the backend directory (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tutorlink_db
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CORS_ORIGIN=http://localhost:5173
```

4. Run database migrations:

```bash
npm run migrate
```

5. Seed the database with sample data:

```bash
npm run seed
```

## Running the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/me` - Get current user (protected)

### Users

- `PUT /api/v1/users/profile` - Update user profile (protected)
- `PUT /api/v1/users/password` - Update password (protected)

### Tutors

- `GET /api/v1/tutors` - Get all tutors (with filters)
- `GET /api/v1/tutors/:id` - Get tutor by ID
- `GET /api/v1/tutors/:id/reviews` - Get tutor reviews
- `PUT /api/v1/tutors/profile` - Update tutor profile (protected, tutor only)

### Sessions

- `GET /api/v1/sessions` - Get user sessions (protected)
- `POST /api/v1/sessions` - Book a session (protected)
- `PUT /api/v1/sessions/:id/cancel` - Cancel session (protected)
- `PUT /api/v1/sessions/:id/complete` - Complete session (protected, tutor only)

### Reviews

- `GET /api/v1/reviews` - Get user reviews (protected)
- `GET /api/v1/reviews/tutor/:id` - Get reviews for a tutor
- `POST /api/v1/reviews` - Submit a review (protected)

### Tasks

- `GET /api/v1/tasks` - Get user tasks (protected)
- `POST /api/v1/tasks` - Create a task (protected)
- `PUT /api/v1/tasks/:id` - Update a task (protected)
- `DELETE /api/v1/tasks/:id` - Delete a task (protected)
- `POST /api/v1/tasks/:id/comments` - Add comment to task (protected)

### Study Plans

- `GET /api/v1/plans` - Get user study plans (protected)
- `POST /api/v1/plans/generate` - Generate AI study plan (protected)
- `PUT /api/v1/plans/:planId/items/:itemId` - Update plan item (protected)
- `DELETE /api/v1/plans/:id` - Delete plan (protected)

### Messaging

- `GET /api/v1/messages/conversations` - Get user conversations (protected)
- `POST /api/v1/messages/conversations` - Create conversation (protected)
- `GET /api/v1/messages/conversations/:conversationId/messages` - Get messages (protected)
- `POST /api/v1/messages/conversations/:conversationId/messages` - Send message (protected)

### Subjects

- `GET /api/v1/subjects` - Get all subjects
- `GET /api/v1/subjects/:id` - Get subject by ID

### Notifications

- `GET /api/v1/notifications` - Get user notifications (protected)
- `PUT /api/v1/notifications/:id/read` - Mark notification as read (protected)
- `PUT /api/v1/notifications/read-all` - Mark all as read (protected)

### Dashboard

- `GET /api/v1/dashboard/student` - Get student dashboard data (protected, student only)
- `GET /api/v1/dashboard/tutor` - Get tutor dashboard data (protected, tutor only)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

Error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Error message"
}
```

## Deployment

### Cloud Deployment (AWS, Azure, GCP, etc.)

1. Set environment variables in your hosting platform
2. Ensure MySQL database is accessible
3. Run migrations: `npm run migrate`
4. Start the server: `npm start`

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tutorlink
JWT_SECRET=your_strong_secret_key
CORS_ORIGIN=https://your-frontend-domain.com
```

## Logging

Logs are stored in the `logs/` directory:

- `access.log` - HTTP access logs
- `app.log` - Application logs
- `error.log` - Error logs

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration
- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention with parameterized queries

## Database Schema

See `scripts/schema.sql` for the complete database schema.

## License

ISC
