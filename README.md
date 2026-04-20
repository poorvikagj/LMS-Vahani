# LMS-Vahani: AI-Powered Learning Management System

<div align="center">

![LMS Vahani](https://img.shields.io/badge/LMS-Vahani-blue.svg)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB.svg?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg?logo=postgresql)
![OpenAI](https://img.shields.io/badge/OpenAI-Integration-412991.svg?logo=openai)

**A modern, AI-enhanced Learning Management System built with React, Node.js, and PostgreSQL**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Deployment](#deployment) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running Locally](#running-locally)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

**LMS-Vahani** is a comprehensive Learning Management System designed for educational institutions to manage students, programs, assignments, attendance, and analytics. The platform incorporates **AI-powered features** using OpenAI's API to provide intelligent insights, analytics summaries, and an interactive assistant for both administrators and students.

The system enables:
- **Administrators** to manage programs, students, assignments, and view detailed analytics
- **Students** to track their performance, submit assignments, and get AI-powered insights
- **Real-time Analytics** with AI-generated summaries and intelligent querying
- **Automated Excel Import/Export** for bulk student and enrollment management
- **Google OAuth Integration** for seamless authentication
- **Cloud Storage** using Cloudinary for file management

---

## ⭐ Features

### Core Features

#### **👨‍💼 Admin Dashboard**
- Comprehensive dashboard with overview of programs, students, and assignments
- Manage multiple educational programs with detail pages
- Create and track programs with assigned instructors
- View key metrics at a glance

#### **📚 Program Management**
- Create and manage educational programs
- Assign instructors/in-charges to programs
- Track total classes and program details
- View program-specific analytics and enrollment status

#### **👥 Student Management**
- Add, edit, and delete students
- Bulk import students via Excel upload
- Track student enrollment across multiple programs
- View individual student performance metrics
- Student batch tracking and organization

#### **📝 Assignment Management**
- Create assignments with due dates and descriptions
- Assign tasks to specific programs or students
- Track submission status (Submitted/Not Submitted)
- Grade assignments and provide feedback
- View submission history

#### **✅ Attendance Tracking**
- Mark attendance for students by program
- Track attendance percentage per student
- Generate attendance reports
- Calculate class participation metrics

#### **📊 Analytics & Reporting**
- Comprehensive analytics dashboard
- Program-wise performance analysis
- Student performance analytics
- Attendance trend analysis
- Assignment submission rates
- Course-specific analytics with detailed breakdowns

### 🤖 AI-Powered Features

#### **AI Analytics Assistant**
- Natural language querying of analytics data
- Intelligent summaries of program performance
- Real-time insights generation using OpenAI
- AI-powered analysis of student performance trends

#### **AI Summary Panel**
- One-click AI-generated summaries for analytics data
- Key insights and recommendations
- Top performers and areas of improvement identification
- Automated insight generation

#### **Ask AI Input**
- Interactive chat interface for analytics queries
- Ask questions in natural language about program data
- Get AI-generated answers with specific metrics
- Real-time data analysis

#### **Student AI Assistant**
- Personalized AI assistant for students
- Performance analysis and recommendations
- Help with understanding coursework
- Engagement and motivation support

### 🔐 Authentication & Security
- Admin and student login system
- Secure password hashing with bcryptjs
- JWT-based authentication
- Google OAuth 2.0 integration
- Session management with express-session
- Role-based access control

### 📁 File Management
- Excel file import for bulk student enrollment
- Secure file uploads to Cloudinary
- Document and resource management
- Automatic cleanup of uploads

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19.2.4 with Vite (build tool)
- **Routing:** React Router DOM 7.13.1
- **HTTP Client:** Axios 1.13.6
- **Charting:** Chart.js 4.5.1 with react-chartjs-2
- **UI Features:** React Toastify for notifications
- **Code Quality:** ESLint with React plugins

### Backend
- **Runtime:** Node.js with Express 5.2.1
- **Database:** PostgreSQL 8.20.0
- **Authentication:** 
  - JWT (jsonwebtoken 9.0.3)
  - Passport.js with Google OAuth 2.0
  - bcryptjs for password hashing
- **AI Integration:** OpenAI API 4.104.0
- **File Upload:** 
  - Multer 2.1.1 for file handling
  - Cloudinary 1.41.3 for cloud storage
- **Excel Processing:** ExcelJS 4.4.0, XLSX 0.18.5
- **CORS:** Cross-origin resource sharing enabled
- **Environment:** dotenv for configuration

### Database
- **PostgreSQL** with comprehensive schema
- Tables for: programs, students, admins, enrollments, permissions, attendance, assignments, submissions, performance metrics

### Deployment
- **Database:** Supabase (PostgreSQL)
- **Backend:** Render or similar Node.js hosting
- **Frontend:** Vercel or similar React hosting
- **File Storage:** Cloudinary
- **AI:** OpenAI API

---

## 📁 Project Structure

```
Vahani/
├── backend/                          # Node.js Express Server
│   ├── controllers/                  # Business logic
│   │   ├── analyticsAIController.js # AI analytics and chat
│   │   ├── authController.js         # Authentication logic
│   │   └── excelController.js        # Excel import/export
│   ├── routes/                       # API route definitions
│   │   ├── authRoutes.js
│   │   ├── analyticsAIRoutes.js      # AI analytics endpoints
│   │   ├── programRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── performanceRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── excelRoutes.js
│   │   └── studentAIRoutes.js        # Student AI endpoints
│   ├── middleware/                   # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   ├── studentMiddleware.js
│   │   ├── upload.js                 # Multer configuration
│   │   └── errorHandler.js
│   ├── db/
│   │   ├── db.js                     # PostgreSQL connection
│   │   └── schema.sql                # Database schema
│   ├── scripts/
│   │   └── run-schema.js             # Database initialization
│   ├── server.js                     # Express app entry point
│   ├── package.json
│   ├── .env                          # Environment variables
│   └── cloudConfig.js                # Cloudinary configuration
│
├── frontend/                         # React + Vite Application
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── StudentSidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── ai/                   # AI feature components
│   │   │       ├── AnalyticsSummaryCard.jsx
│   │   │       ├── AskAIAnalyticsInput.jsx
│   │   │       ├── AnalyticsChatAssistant.jsx
│   │   │       ├── StudentChatAssistant.jsx
│   │   │       └── analytics-ai.css
│   │   ├── pages/                    # Page components
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── Programs.jsx
│   │   │   │   ├── ProgramDetails.jsx
│   │   │   │   ├── StudentManagement.jsx
│   │   │   │   ├── GradeAssignments.jsx
│   │   │   │   ├── ManageAssignments.jsx
│   │   │   │   ├── Analytics.jsx      # Main analytics page
│   │   │   │   ├── CourseAnalyticsPage.jsx
│   │   │   │   ├── ProgramAnalyticsPage.jsx
│   │   │   │   ├── StudentAnalyticsPage.jsx
│   │   │   │   ├── PerformanceAnalyticsPage.jsx
│   │   │   │   ├── StudentReport.jsx  # AI report modal
│   │   │   │   ├── UploadExcel.jsx
│   │   │   │   └── CreateProgram.jsx
│   │   │   └── student/
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── MyPrograms.jsx
│   │   │       ├── Assignments.jsx
│   │   │       └── Performance.jsx
│   │   ├── services/                 # API service calls
│   │   │   ├── api.js                # Axios instance
│   │   │   ├── authService.js
│   │   │   ├── programService.js
│   │   │   ├── studentService.js
│   │   │   └── adminService.js
│   │   ├── utils/
│   │   │   └── ProtectedRoute.jsx    # Route protection
│   │   ├── public/css/                # Global stylesheets
│   │   │   ├── dashboard.css
│   │   │   └── analytics-dashboard.css
│   │   ├── App.jsx                   # Root component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── index.html
│
├── DEPLOYMENT_GUIDE.md               # Detailed deployment instructions
└── README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) and npm
- **PostgreSQL** (v12 or higher) - or use Supabase for cloud database
- **Git** for version control
- **OpenAI API Key** (for AI features)
- **Cloudinary Account** (for file uploads)
- **Google OAuth Credentials** (optional, for social login)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Vahani.git
cd Vahani
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL / Supabase)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=vahani_lms
DB_PASSWORD=your_password
DB_PORT=5432

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Default Admin Credentials
DEFAULT_ADMIN_EMAIL=admin@lms.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_USERNAME=admin

# CORS Configuration
CLIENT_URL_LOCAL=http://localhost:5173
FRONTEND_URL=https://your-frontend-domain.com

# Cloudinary (File Uploads)
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# OpenAI (AI Features)
OPENAI_API_KEY=your_openai_api_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running Locally

#### 1. Initialize Database

First, ensure PostgreSQL is running, then run the schema:

```bash
cd backend
npm run dev
# In another terminal
node scripts/run-schema.js
```

#### 2. Start Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

The backend will start at `http://localhost:5000`

#### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:5173`

#### Default Login Credentials

**Admin:**
- Email: `admin@lms.com`
- Password: `admin123`

---

## 🗄 Database

### Database Schema Overview

#### Core Tables

**programs**
- Stores educational program information
- Fields: `program_id`, `program_name`, `program_incharge`, `total_class`

**students**
- Stores student information
- Fields: `student_id`, `name`, `email`, `password`, `batch`

**admins**
- Stores admin credentials
- Fields: `admin_id`, `email`, `password`

**enrollments**
- Tracks student enrollment in programs
- Relationships: Links `students` to `programs`
- Unique constraint on (student_id, program_id)

**assignments**
- Stores assignment details
- Fields: `assignment_id`, `program_id`, `title`, `description`, `due_date`

**submissions**
- Tracks assignment submissions
- Relationships: Links `students` to `assignments`
- Fields: `submission_id`, `student_id`, `assignment_id`, `submitted_at`, `status`

**attendance**
- Tracks student attendance
- Fields: `attendance_id`, `student_id`, `program_id`, `date`, `status`

**permissions**
- Defines system permissions
- Fields: `permission_id`, `permission_name`

**performance**
- Tracks student performance metrics
- Fields: `performance_id`, `student_id`, `program_id`, `score`, `evaluation_date`

### Database Operations

**Initialize Database:**
```bash
cd backend
npm run dev  # Starts server and creates tables if they don't exist
```

**Connect to Database:**
- Local PostgreSQL: Update credentials in `.env`
- Cloud (Supabase): Use provided connection string

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed Supabase setup instructions.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin/Student login |
| POST | `/api/auth/signup` | Student registration |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/google` | Google OAuth login |

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | List all programs |
| POST | `/api/programs` | Create program |
| GET | `/api/programs/:id` | Get program details |
| PUT | `/api/programs/:id` | Update program |
| DELETE | `/api/programs/:id` | Delete program |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create student |
| GET | `/api/students/:id` | Get student details |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create assignment |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/:id/submit` | Submit assignment |
| GET | `/api/assignments/:id/submissions` | Get submissions |

### Analytics (AI-Powered)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get analytics data |
| POST | `/api/analytics-ai/summary` | Get AI summary |
| POST | `/api/analytics-ai/query` | Query with AI |
| POST | `/api/analytics-ai/chat` | Chat with AI assistant |

### Student AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student-ai/chat` | Student AI chat |
| GET | `/api/student-ai/performance` | AI performance analysis |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance` | Mark attendance |
| DELETE | `/api/attendance/:id` | Delete attendance record |

### Excel Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/excel/upload` | Upload Excel file (bulk student import) |
| GET | `/api/excel/export` | Export data as Excel |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Admin dashboard data |
| GET | `/api/student-dashboard` | Student dashboard data |

---

## 🚀 Deployment

### Option 1: Supabase + Render + Vercel (Recommended)

Complete step-by-step deployment guide available in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Quick Overview:**
1. **Database:** Set up Supabase PostgreSQL
2. **Backend:** Deploy to Render
3. **Frontend:** Deploy to Vercel
4. **Environment:** Configure secrets in each platform

### Option 2: Traditional Hosting

- **Database:** Self-hosted PostgreSQL
- **Backend:** Node.js hosting (Heroku, Railway, etc.)
- **Frontend:** Static hosting (AWS S3, Netlify, etc.)

### Environment Variables for Production

Update environment variables in production deployments:
- Database credentials (use cloud provider)
- JWT secret (strong random string)
- API keys (OpenAI, Cloudinary, Google OAuth)
- CORS origins (production domain)
- NODE_ENV=production

---

## 🔧 Development

### Running Tests

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
# Ensure all environment variables are set
npm start
```

### Code Quality

- **Frontend:** ESLint with React plugin
- **Backend:** Follow Node.js best practices
- **Database:** Use parameterized queries to prevent SQL injection

---

## 📚 Key Features in Detail

### AI Analytics Assistant

The system uses OpenAI's GPT API to provide intelligent analytics:

**Features:**
- **Summary Generation:** One-click AI summaries of program performance
- **Natural Language Queries:** Ask questions about data in plain English
- **Trend Analysis:** AI identifies patterns and trends
- **Recommendations:** System provides actionable insights

**Implementation:**
- Backend endpoint: `/api/analytics-ai/chat`
- Uses OpenAI API for natural language processing
- Generates context-aware responses based on database queries

### Bulk Student Import

Admin can upload Excel files to import multiple students and enrollments:

**Features:**
- **Excel Upload:** Drag-and-drop or file selection
- **Data Validation:** Ensures data integrity
- **Batch Processing:** Handles large imports
- **Error Reporting:** Shows validation errors

**Implementation:**
- Uses Multer for file upload
- ExcelJS for parsing
- Cloudinary for file storage

### Real-time Analytics

Comprehensive analytics dashboard with multiple views:

- **Program Analytics:** Course performance, enrollment trends
- **Student Analytics:** Individual performance, progress tracking
- **Performance Analytics:** Grade distributions, capability analysis
- **Course Analytics:** Attendance, submission rates, engagement metrics

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Test changes before submitting PR
- Update documentation as needed
- Ensure CORS and security best practices are followed

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review DEPLOYMENT_GUIDE.md for deployment issues

---

## 🎯 Roadmap

- [ ] Mobile app version
- [ ] Advanced ML-based performance prediction
- [ ] Video lecture integration
- [ ] Interactive quizzes and assessments
- [ ] Parent portal for monitoring
- [ ] Blockchain-based certifications
- [ ] Advanced scheduling and timetable management

---

## 🙏 Acknowledgments

Built with modern web technologies and open-source libraries:
- React community
- Express.js framework
- PostgreSQL database
- OpenAI for AI capabilities
- Cloudinary for cloud storage
- Vercel for frontend hosting
- Render for backend hosting

---

<div align="center">

Made with ❤️ by the Vahani Team

[⬆ back to top](#lms-vahani-ai-powered-learning-management-system)

</div>

