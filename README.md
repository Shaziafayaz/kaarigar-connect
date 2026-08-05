# Kaarigar Connect

Kaarigar Connect is a college full-stack project that connects customers with local skilled workers, including plumbers, electricians, carpenters, painters, mechanics, gardeners, and tutors.

## Milestone 1: Foundation

The Express server and MongoDB connection are configured. Authentication and application features have not been started yet.

### Requirements

- Node.js 18 or later
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

### Installation and run

1. Open a terminal in this folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `MONGODB_URI` in `.env` if you are using MongoDB Atlas.
5. Start MongoDB, then run `npm run dev`.
6. Open `http://localhost:5000/api/health` to confirm the server is running.

## Project structure

```text
kaarigar-connect/
|- server/
|  |- config/       # Database and environment configuration
|  |- controllers/  # Request-handling logic (future milestones)
|  |- middleware/   # Authentication and error middleware (future milestones)
|  |- models/       # Mongoose schemas (future milestones)
|  |- routes/       # Express route definitions (future milestones)
|  |- uploads/      # Worker profile images (future milestones)
|  |- utils/        # Shared helper functions (future milestones)
|  |- app.js        # Express application configuration
|  `- server.js     # Application entry point
|- public/          # HTML, CSS, JavaScript, and static assets (future milestones)
|- CHANGELOG.md
|- IMPLEMENTATION_STATUS.md
`- README.md
```

## API documentation (current)

### `GET /api/health`

Returns an HTTP 200 response with basic server status. No authentication is required.

## User manual (current)

At this stage, use the health-check endpoint to verify the setup. Customer, worker, and admin user flows will be documented as their modules are completed.
