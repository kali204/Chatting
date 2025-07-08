#  SecureChat - Private Messaging Platform

A secure, real-time 1-to-1 messaging application built with React, Flask, and MySQL.

## Features

- **User Authentication**: JWT-based secure login/registration
- **Real-time Messaging**: Socket.IO for instant message delivery
- **Private Conversations**: Secure 1-to-1 chat functionality
- **Message History**: Complete chat history stored in MySQL
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- Lucide React icons
- Socket.IO client

**Backend:**
- Flask with Flask-SocketIO
- MySQL database
- JWT authentication
- RESTful API endpoints

## Setup Instructions

### Database Setup
1. Install MySQL and create database:
```sql
mysql -u root -p < database/schema.sql
```

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
pip install -r requirements.txt
```

2. Update database credentials in `app.py`
3. Run Flask server:
```bash
python app.py
```

### Frontend Setup
Frontend runs automatically with Vite dev server.

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Token validation
- `GET /api/users` - Get all users except current
- `GET /api/messages/<user_id>` - Get messages with specific user
- `POST /api/messages` - Send new message

## Security Features

- Password hashing with Werkzeug
- JWT token authentication
- CORS protection
- Input validation
- SQL injection prevention
 