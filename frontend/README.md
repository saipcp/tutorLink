# TutorLink - AI-Powered Tutoring Platform

A modern, responsive React-based tutoring platform that connects students with expert tutors while providing AI-powered study planning and progress tracking.

## 🚀 Features

### Core Functionality

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Role-Based Access**: Support for Students, Tutors, and Administrators
- **Authentication System**: Secure login/logout with persistent sessions
- **Tutor Discovery**: Advanced search and filtering system for finding tutors
- **Session Booking**: Real-time availability and instant booking confirmation
- **Study Planning**: AI-powered study plan generation and task management
- **Messaging System**: Real-time communication between students and tutors
- **Review & Rating System**: Comprehensive feedback and rating system
- **Progress Tracking**: Detailed analytics and progress monitoring

### AI Integration

- **AiTutor**: AI assistant for answering questions and providing guidance
- **Study Plan Generator**: AI-powered personalized study plans
- **Accessibility Audit**: Automated WCAG compliance checking
- **Smart Recommendations**: AI-driven tutor and content recommendations

### User Roles

#### Students

- Browse and filter available tutors
- Book tutoring sessions
- Create and manage study plans
- Track learning progress
- Communicate with tutors
- Leave reviews and ratings

#### Tutors

- Manage availability and schedule
- View student profiles and history
- Track earnings and performance
- Manage session notes and materials
- Receive and respond to messages

#### Administrators

- User and role management
- Subject catalog management
- Platform analytics and insights
- AI settings and configuration
- Security and moderation tools

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and state management
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool and development server

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

### Demo Accounts

For testing purposes, you can use these demo accounts:

- **Student**: john.doe@email.com / password
- **Tutor**: jane.smith@email.com / password
- **Admin**: admin@tutorlink.com / password

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Navbar, Sidebar, etc.)
│   └── ui/            # Base UI components
├── context/           # React context providers
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API services and mock data
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🎨 Design System

### Colors

- **Primary**: Blue shades (#3b82f6 to #1e3a8a)
- **Secondary**: Gray shades (#f8fafc to #0f172a)
- **Accent**: Supporting colors for highlights and CTAs

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 100-900
- **Responsive Typography**: Fluid scaling for all screen sizes

### Components

- **Cards**: Consistent styling for content containers
- **Buttons**: Primary, secondary, and outline variants
- **Forms**: Accessible form inputs with validation states
- **Navigation**: Responsive sidebar and mobile-friendly navbar

## 📱 Responsive Design

The application is fully responsive with these breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach

- Touch-friendly interface
- Collapsible navigation
- Optimized forms and interactions
- Readable typography scaling

## ♿ Accessibility

Built with accessibility in mind:

- **WCAG 2.1 AA Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: High contrast ratios for readability
- **Focus Management**: Visible focus indicators

## 🤖 AI Integration

### AiTutor

- Context-aware responses
- Subject-specific guidance
- Learning style adaptation
- Progress-based recommendations

### Study Plan Generator

- Personalized learning paths
- Adaptive difficulty scaling
- Time-based scheduling
- Progress tracking integration

### Accessibility Audit

- Automated WCAG compliance checking
- Real-time accessibility scoring
- Improvement suggestions
- Continuous monitoring

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **Bundle Optimization**: Code splitting and lazy loading
- **Caching**: React Query for efficient data fetching
- **Image Optimization**: Responsive images with proper formats

## 📝 Development

### Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

   The development server includes:

   - **Hot Module Replacement (HMR)** - Instant updates without page refresh
   - **Automatic port cleanup** - Frees ports when Ctrl+C is pressed
   - **Cross-platform compatibility** - Works on macOS, Linux, and Windows
   - **Network access** - Available on your local network

### Available Scripts

- `npm run dev` - Start enhanced development server with port cleanup
- `npm run dev:direct` - Start Vite directly (without port cleanup)
- `npm run dev:safe` - Kill existing processes and start fresh
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run kill-port` - Manually free up ports 5173 and 5174

### Available Pages

**Public Pages:**

- `/` - Landing page with platform overview
- `/login` - User login with demo accounts
- `/register` - User registration with role selection
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/about` - About TutorLink and team information
- `/help` - Help center with FAQ and support
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service

**Authenticated Pages:**

- `/dashboard` - Student dashboard (role-based)
- `/tutor-dashboard` - Tutor dashboard
- `/admin` - Admin dashboard (nested routes)
- `/admin/dashboard` - Admin dashboard overview
- `/admin/users` - Admin user management
- `/admin/subjects` - Admin subject catalog
- `/admin/analytics` - Admin platform analytics
- `/admin/ai` - Admin AI settings
- `/admin/security` - Admin security settings
- `/browse` - Browse and discover tutors
- `/tutor/:id` - Individual tutor profiles
- `/book/:tutorId` - Book tutoring sessions
- `/profile` - User profile management
- `/settings` - Account settings
- `/sessions` - Session management
- `/messages` - Communication with tutors
- `/tasks` - Task management
- `/reviews` - Reviews and ratings
- `/study-planner` - AI-powered study planning

### Authentication Features

- **Complete Registration Flow**: Full-featured registration with role selection
- **Password Reset**: Forgot password and reset password functionality
- **Form Validation**: Comprehensive client-side validation
- **Role-Based Access**: Student, Tutor, and Admin role support
- **Profile Management**: Editable user profiles with statistics
- **Help & Support**: Comprehensive help center with FAQ and contact options
- **Legal Pages**: Privacy Policy, Terms of Service, and About pages
- **Admin Panel**: Comprehensive admin dashboard with nested routes for user management, analytics, and platform settings

### Development Features

- **Fast Refresh**: Changes to React components update instantly
- **Source Maps**: Detailed debugging information in browser dev tools
- **Network Access**: Access the app from other devices on your network
- **Port Management**: Automatic cleanup prevents port conflicts

### Troubleshooting

If you encounter port conflicts:

```bash
# Kill processes on development ports
npm run kill-port

# Or start with safe mode
npm run dev:safe
```

### Adding New Features

1. **Create Components**: Add new components in `src/components/`
2. **Add Pages**: Create page components in `src/pages/`
3. **Update Routing**: Modify `src/App.jsx` to add new routes
4. **Add API Services**: Extend `src/services/mockApi.ts`
5. **Update Types**: Add new types in `src/types/index.ts`

## 🚀 Deployment

## ✅ Bugfix: Access token persisted on login

If you saw 401s like "Access token required" when calling admin endpoints from the UI, it's usually because the frontend wasn't persisting the token returned at login. The Auth flow now saves the token returned by `/auth/login` into localStorage under the key `tutorlink_user`.

How to verify locally:

1. Start the backend + frontend dev servers.
2. Log in using the admin demo account: `admin@tutorlink.com / password`.
3. Open browser DevTools -> Application -> Local Storage -> `tutorlink_user` and confirm the stored object contains a `token` field.
4. In Network tab, perform an admin action like creating a user from the Admin Dashboard. Confirm the request to `/api/v1/admin/users` includes the `Authorization: Bearer <token>` header and returns 200/201 instead of 401.

If the token is missing, re-login (or clear `tutorlink_user`) and try again.

## ✅ Bugfix: Admin - Add Subject behavior

Fixed two issues in the Admin UI:

- Subjects form would close without submitting — now it actually calls the API and only closes on success.
- Topics input previously split only on commas and had awkward default values — topics now accept comma, semicolon or newline separators and preserve spaces inside topic names.

How to verify:

1. Log in as an admin (demo: `admin@tutorlink.com / password`).
2. From the Admin Dashboard or Admin Subjects page, click Add Subject.
3. Try entering topics using commas, semicolons, or newlines, and include spaces inside topic names (e.g. `Algebra I, Linear algebra; Calculus\nAdvanced topics`).
4. Click Add Subject — the modal should stay open only if there's a validation error. On success the modal closes, and the new subject appears in the subject list.

If the subject still does not appear, check the Network tab for the POST request and ensure it includes an `Authorization: Bearer <token>` header and returns 200/201.

## 🔎 Manual verification checklist — Dashboard flows

Use this checklist to verify forms, modals and API integrations across dashboards.

1. Admin (Admin Dashboard / Admin Subjects / Admin Users)

   - Log in as an admin and confirm `localStorage.tutorlink_user` includes a `token`.
   - Create a new subject (Admin Dashboard and Admin Subjects) using commas/semicolons/newlines; verify POST /api/v1/subjects returns 201 and subject appears.
   - Create a new user (Admin Users): verify POST /api/v1/admin/users returns 201 and user appears in list.
   - Update and delete users/subjects and confirm appropriate PUT/DELETE requests return 200 and UI updates.

2. Student Dashboard / Task Management

   - Create a task (Quick Add from Student Dashboard and Task Management): verify POST /api/v1/tasks returns 201 and task appears in tasks list.
   - Update task status and confirm PUT /api/v1/tasks/:id returns 200 and UI updates.

3. Tutor Dashboard / Availability

   - Update availability and confirm PUT /api/v1/tutors/profile returns 200 and availability shown to students.
   - Complete/cancel sessions and ensure the corresponding PUT endpoints return 200 and UI updates.

4. Booking flows

   - Book a session from the booking page and confirm POST /api/v1/sessions returns 201, user is redirected to their sessions page, and session appears.

5. Profile & Authentication

   - Update profile (Profile page) — PUT /api/v1/users/profile returns updated user and UI reflects changes.
   - Login/Logout flows: token is persisted in `tutorlink_user` and Authorization header appears on protected calls.

6. Study Planner
   - Generate a study plan (Study Planner / Task Management) — ensure POST or AI flow returns plan and it appears in the UI.

If any step returns 401 or no token is present, first re-login and check browser console/network. If you hit any non-2xx errors, capture the request/response and I can help debug further.

### Build for Production

```bash
npm run build
```

### Deploy Options

- **Vercel**: Recommended for React applications
- **Netlify**: Alternative deployment platform
- **AWS S3 + CloudFront**: For scalable applications

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first approach
- **Vite** for the fast development experience

---

Made with ❤️ by the TutorLink team
