# SecureChat - Private Messaging Platform

A secure, real-time 1-to-1 messaging platform built with **React, Flask, and MySQL**.  
Designed for **privacy**, **speed**, and **modern UI** — and soon integrating **AI-powered chatbots** for enhanced conversations.

---

## Features

- **User Authentication**  
  - JWT-based secure login/registration  
  - Password hashing with Werkzeug  

- **Real-time Messaging**  
  - **Socket.IO** for instant message delivery  
  - Typing indicators & online status (coming soon)  

- **Private Conversations**  
  - End-to-end message storage with MySQL  
  - Secure 1-to-1 chat functionality  

- **Password Management**  
  - Simple "Forgot Password" flow with password reset  

- **Nearby Users (Beta)**  
  - Find users within a certain radius (location-based)  

- **Responsive UI**  
  - Modern design with React, Tailwind CSS, and Lucide React icons  

- **Security**  
  - JWT token authentication  
  - CORS protection  
  - SQL injection prevention  
  - Input validation  

---

## Upcoming Features

- **AI Assistant**  
  - Chat with an AI that feels like a real user (OpenAI API integration)  
  - Smart suggestions and message summarization  

- **Voice & Video Calls** (future roadmap)  
- **File Sharing** (images, documents, etc.)  
- **Dark Mode**  
- **Group Chats**  

---

## Tech Stack

**Frontend:**  
- React 18 with Vite  
- Tailwind CSS  
- Lucide React icons  
- Socket.IO client  

**Backend:**  
- Flask (with Flask-SocketIO)  
- MySQL database  
- JWT authentication  
- RESTful API endpoints  

---

## Setup Instructions

### Database Setup
1. Install MySQL and create database:
   ```sql
   mysql -u root -p < database/schema.sql

### Backend Setup
1. Navigate to backend directory:

    cd backend
    pip install -r requirements.txt

    Update database credentials in app.py
    Run Flask server:

    python app.py

### Frontend Setup
1. Navigate to frontend directory:

    cd frontend
    npm install
    npm run dev

## API Endpoints

    POST /api/auth/register – User registration

    POST /api/auth/login – User login

    GET /api/auth/validate – Token validation

    POST /api/auth/reset-password – Password reset

    GET /api/users – Fetch all users (except current)

    GET /api/messages/<user_id> – Get messages with a specific user

    POST /api/messages – Send a new message

    GET /api/users_nearby – Get nearby users (Beta)

    POST /api/nearby/update_location – Update user location

## Security Features

   1. Password hashing with Werkzeug

   2. JWT token authentication

   3. SQL injection prevention

   4. Input validation and sanitization

   5. CORS protection

## Contributing

``We welcome contributions!

        Fork the repo & submit pull requests

        Report bugs or request features via Issues

        Follow the MIT License