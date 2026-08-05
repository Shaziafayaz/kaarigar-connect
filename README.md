# Kaarigar Connect

Kaarigar Connect is a college full-stack project that connects customers with local skilled workers, including plumbers, electricians, carpenters, painters, mechanics, gardeners, and tutors.

## Completed milestones

- Foundation: Express server, MongoDB configuration, and health endpoint.
- Authentication: user registration/login, JWT access tokens, authenticated-user endpoint, role authorization middleware, validation, and error responses.

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

### Run automated checks

Run `npm test`. The current tests do not require a running MongoDB instance.

## Project structure

```text
kaarigar-connect/
|- server/
|  |- config/       # Database and environment configuration
|  |- controllers/  # Request-handling logic
|  |- middleware/   # Authentication and error middleware
|  |- models/       # Mongoose schemas
|  |- routes/       # Express route definitions
|  |- uploads/      # Worker profile images (future milestone)
|  |- utils/        # Shared helper functions
|  |- app.js        # Express application configuration
|  `- server.js     # Application entry point
|- test/            # Automated tests
|- public/          # HTML, CSS, JavaScript, and static assets (future milestone)
|- CHANGELOG.md
|- IMPLEMENTATION_STATUS.md
`- README.md
```

## API documentation

### `GET /api/health`

Returns an HTTP 200 response with basic server status. No authentication is required.

### Authentication endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Register a customer or worker | Public |
| POST | `/api/auth/login` | Log in and receive a JWT | Public |
| GET | `/api/auth/me` | Get the current user profile | Bearer token |
| POST | `/api/auth/logout` | Confirm client-side JWT logout | Bearer token |

Registration requires `name`, `email`, and an 8+ character `password`; `phone` and `role` are optional. The accepted public roles are `customer` and `worker`. Admin accounts cannot be created through public registration.

Pass protected requests with `Authorization: Bearer <token>`.

## User manual (current)

1. Register as a customer or worker with `POST /api/auth/register`.
2. Save the returned JWT securely in the client application.
3. Send the JWT as a Bearer token to use `GET /api/auth/me`.
4. To log out, remove the saved JWT and call `POST /api/auth/logout` if confirmation is needed.

Customer, worker, and admin workflows beyond authentication will be documented as their modules are completed.
