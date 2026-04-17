# AI-Assisted Employee Task Management System

A smart task management system with AI-powered insights using Groq API.

## Features

- Smart Task Allocation (Rule-Based + AI)
- Workload Balance Indicator
- Productivity Dashboard with Charts
- Task Priority System
- Employee Performance Tracking
- Stress Level Check with AI Analysis
- Team Overview Panel
- Notifications System

## Tech Stack

- **Frontend**: React + Tailwind CSS + Recharts
- **Backend**: Express.js
- **Database**: MongoDB
- **AI**: Groq API (LLaMA 3)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Groq API Key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/taskmanagement
PORT=5000
GROQ_API_KEY=your_groq_api_key
```

3. Start MongoDB (if using local):
```bash
mongod
```

4. Run the application:
```bash
npm start
```

This will start both the backend server (port 5000) and frontend (port 3000).

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `PUT /api/employees/:id/stress` - Update stress level

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `POST /api/tasks/auto-assign` - Auto-assign task with AI
- `POST /api/tasks/suggest` - Get AI suggestion
- `PUT /api/tasks/:id/status` - Update task status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/team-overview` - Get team overview

### AI
- `POST /api/ai/analyze-stress` - Analyze stress level

## Getting Groq API Key

1. Visit https://console.groq.com/
2. Create an account
3. Generate an API key
4. Add to `.env` file
