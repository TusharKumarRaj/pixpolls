# Pix Polls

Pix Polls is a full-stack polling application with a Node.js and Express backend and a React frontend built with Vite. The backend handles user authentication, poll creation, response submission, and real-time updates via Socket.IO. The frontend includes pages for registration, login, creating polls, viewing personal polls, submitting responses, and displaying poll results.

## Tech stack

- Backend: Node.js, Express, MongoDB with Mongoose, JWT authentication, bcryptjs password hashing, Joi validation, Socket.IO
- Frontend: React, React Router, Vite, Socket.IO client
- Tooling: ESLint

## Project structure

- `backend/` contains the Express server, API routes, models, services, and real-time socket hub
- `frontend/` contains the React app, API client, pages, components, and socket integration

## Demo video


https://github.com/user-attachments/assets/00c427ce-737b-49ef-bb94-bd92915324e2







## Run locally

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
3. Start the backend server:
   ```bash
   cd ../backend
   npm start
   ```
4. Start the frontend app:
   ```bash
   cd ../frontend
   npm run dev
   ```

## Notes

- The backend expects environment configuration for database connection and JWT settings.
- The frontend communicates with the backend API and uses Socket.IO for real-time poll updates.
