# TutorLink - AI-Powered Peer Tutoring & Study Planner

A full-stack web application connecting students for peer tutoring while helping them plan study time and track progress. Built with React frontend and Node.js/Express backend with MySQL database.

## Features

- **User Management**: Registration, authentication, and role-based access (Student, Tutor, Admin)
- **Tutor Matching**: Search and filter tutors by subjects, price, rating, and availability
- **Session Booking**: Book, manage, and track tutoring sessions
- **Study Planner**: AI-powered study plan generation with progress tracking
- **Task Management**: Create, update, and track study tasks
- **Messaging**: Real-time messaging between students and tutors
- **Reviews & Ratings**: Rate and review tutoring sessions
- **Dashboard**: Role-specific dashboards with analytics
- **AI Features**:
  - AI Study Plan Generator
  - Tutor Recommendations
  - Accessibility Audit Helper

## Tech Stack

### Frontend

- React 19
- React Router 7
- TanStack Query (React Query)
- Tailwind CSS
- Vite
- TypeScript

### Backend

- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
TutorLink/
├── backend/                 # Backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth, error handling, logging
│   ├── routes/             # API routes
│   ├── scripts/            # Database migrations and seeds
│   ├── utils/              # Utility functions
│   └── server.js          # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript types
│   └── dist/             # Production build (generated)
└── requirements/          # Project requirements and documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**
   Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=tutorlink
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:5173
```

4. **Run database migrations:**

```bash
npm run migrate
```

5. **Seed database (optional):**

```bash
npm run seed
```

6. **Start the server:**

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**

```bash
cd frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**
   Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

4. **Start development server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Credentials

After running the seed script, you can use these credentials:

- **Admin**: admin@tutorlink.com / password
- **Tutor**: tutor@tutorlink.com / password
- **Student**: student@tutorlink.com / password

## API Documentation

See `backend/README.md` for complete API documentation.

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions for:

- Backend: Cloud platforms (AWS, Heroku, Railway, Render, etc.)
- Frontend: cPanel hosting

## Development

### Backend Development

```bash
cd backend
npm run dev          # Start with auto-reload
npm run migrate      # Run database migrations
npm run seed         # Seed database
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Database Schema

The database includes tables for:

- Users (students, tutors, admins)
- Tutor profiles and availability
- Student profiles
- Subjects and topics
- Sessions and bookings
- Reviews and ratings
- Tasks and study plans
- Messages and conversations
- Notifications
- Payments

See `backend/scripts/schema.sql` for complete schema.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- SQL injection prevention
- CORS configuration
- Rate limiting
- Helmet.js security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues or questions:

- Check the documentation in `backend/README.md` and `DEPLOYMENT.md`
- Review the requirements in `requirements/requirements.txt`
