# 🌟 Women in Tech Networking Platform

A comprehensive networking and event platform designed specifically for women in technology to overcome systemic barriers in networking and mentorship.

## 🔍 Project Overview

This platform addresses challenges that women in tech often face when networking and finding mentors, including exclusion from networking opportunities, lack of mentorship, and unsafe environments. Based on extensive research and surveys from over 300 members of XXIT (South Korea's largest women-in-tech community), the platform offers structured networking, safe spaces, and relevant mentorship connections.

## ✨ Key Features

### 🗓️ Event Discovery

- Browse and search events specifically for women in tech
- Filter by location, date, topic, and more
- Save events with a "like" feature
- Register for events and access event details
- View attendee lists and event information

### 👥 Mentorship Matching

- Smart matching algorithm based on expertise, profession, seniority level, and location
- Send and manage mentorship connection requests
- View similarity scores between potential mentors/mentees
- Accept or reject mentorship requests
- Dual role capability (users can act as both mentors and mentees)

### 💬 Post-Event Chat System

- Real-time communication via WebSockets
- Chat with event attendees or mentorship connections
- Message persistence and history
- Read receipts and typing indicators
- Unread message counts and notifications

### 👤 User Profile Management

- Detailed professional profiles
- Tag-based expertise identification
- Customizable visibility settings
- Profile image upload

## 🛠️ Technology Stack

### 🖥️ Frontend

- Next.js with TypeScript
- TailwindCSS for styling
- WebSocket client for real-time communications

### ⚙️ Backend

- Node.js with Express
- PostgreSQL database
- WebSocket server implementation
- JWT authentication
- RESTful API design

### 🚀 Deployment & Infrastructure

- Vercel for frontend hosting
- Database hosted on a secure cloud provider, Render

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

### 📥 Installation

#### 🔄 Backend Setup

1.Clone the repository

```bash
git clone https://github.com/yourusername/wit-network.git
cd wit-network/backend
```

2.Install dependencies

```bash
npm install
```

3.Set up environment variables

```bash
cp .env.example .env
```

4.Edit the .env file with your database credentials and JWT secret

5.Run database migrations

```bash
npm run migrate
```

6.Start the development server

```bash
npm run dev
```

#### 🎨 Frontend Setup

1.Navigate to the frontend directory

```bash
cd ../frontend
```

2.Install dependencies

```bash
npm install
```

3.Set up environment variables

```bash
cp .env.example .env.local
```

4.Edit the .env.local file with your API URL

5.Start the development server

```bash
npm run dev
```

6.Open http://localhost:3000 with your browser

## 📚 API Documentation

The backend provides a comprehensive RESTful API. Major endpoints include:

- /api/v1/auth - Authentication endpoints
- /api/v1/users - User profile management
- /api/v1/events - Event discovery and management
- /api/v1/mentorship - Mentorship connections
- /api/v1/chat - Chat system endpoints
- /api/v1/notifications - User notifications

## 🧪 Testing

The project includes several types of tests:

- Unit tests using Jest and React Testing Library
- API endpoint tests with Supertest
- Usability testing via A/B testing through Google Analytics
- Accessibility testing with Lighthouse

Run tests with:

```bash
npm test
```
