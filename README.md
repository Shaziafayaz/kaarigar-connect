# Kaarigar Connect

Kaarigar Connect is a college full-stack project that connects customers with local skilled workers, including plumbers, electricians, carpenters, painters, mechanics, gardeners, and tutors.

## Completed milestones

- Foundation: Express server, MongoDB configuration, and health endpoint.
- Authentication: user registration/login, JWT access tokens, authenticated-user endpoint, role authorization middleware, validation, and error responses.
- Worker profiles: skills, experience, pricing, availability, service areas, approval state, and profile-image upload support.
- Service discovery: approved-worker search, filtering, sorting, and pagination.

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
|  |- middleware/   # Authentication, uploads, and error middleware
|  |- models/       # Mongoose schemas
|  |- routes/       # Express route definitions
|  |- uploads/      # Locally stored worker profile images
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

### Worker profile endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| GET | `/api/workers/me/profile` | Get the signed-in worker's profile | Worker token |
| PUT | `/api/workers/me/profile` | Create or update a worker profile | Worker token |
| POST | `/api/workers/me/profile/image` | Upload profile image as multipart form field `image` | Worker token |
| GET | `/api/workers/:workerId` | View an approved worker profile | Public |

To create a worker profile, send `category` and `hourlyRate`. Optional fields are `bio`, `skills` (array), `experienceYears`, `availability`, and `serviceAreas` (array). Valid categories: plumber, electrician, carpenter, painter, mechanic, gardener, tutor, cleaner, and other. Images must be JPG, PNG, or WEBP and no larger than 5 MB.

Worker profiles are unapproved by default. Updating an approved profile or uploading a replacement image submits it for approval again.

### Worker discovery endpoint

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| GET | `/api/workers` | Search approved worker profiles | Public |

Optional query parameters: `q`, `category`, `availability`, `area`, `minRate`, `maxRate`, `sort`, `page`, and `limit`. Valid sort values: `rating` (default), `newest`, `experience`, `price_low`, and `price_high`. Results are paginated (default 12, maximum 50 per page).

Pass protected requests with `Authorization: Bearer <token>`.

## User manual (current)

1. Register as a customer or worker with `POST /api/auth/register`.
2. Save the returned JWT securely in the client application.
3. A worker creates their profile using `PUT /api/workers/me/profile`.
4. A worker uploads an image using `POST /api/workers/me/profile/image` and multipart field `image`.
5. An administrator will approve the profile in the planned admin module; only then is it visible through the public worker-profile endpoint.
6. Customers can search approved workers using `GET /api/workers?category=plumber&area=Pune&sort=rating`.

Customer booking, review, and admin management workflows will be documented as their modules are completed.
