# Changelog

All notable changes to Kaarigar Connect are documented in this file.

## [0.4.0] - 2026-08-05

### Added

- Public approved-worker discovery endpoint with keyword search, category, availability, service-area, and rate filters.
- Rating, newest, experience, and price sorting with bounded pagination.
- Search-query validation and tests that prevent invalid query values from reaching the database.

## [0.3.0] - 2026-08-05

### Added

- Worker profile model with categories, skills, experience, hourly rate, availability, service areas, ratings, and approval state.
- Worker-only profile creation, updates, current-profile retrieval, and public approved-profile endpoint.
- JPG, PNG, and WEBP profile-image upload with MIME validation, random filenames, and a 5 MB limit.
- Static serving for uploaded profile images.
- Automated worker-profile model and access-control tests.

## [0.2.0] - 2026-08-05

### Added

- User model with roles, validation, password hashing, and active-account status.
- Public customer/worker registration and login endpoints.
- JWT creation, authentication middleware, role authorization helper, and current-user endpoint.
- Stateless logout confirmation endpoint.
- Centralized not-found and error-response middleware.
- Automated tests for health, protected access, user validation, and JWT claims.

## [0.1.0] - 2026-08-05

### Added

- Initial Node.js and Express application setup.
- MongoDB connection configuration through Mongoose.
- Environment-variable template and Git ignore rules.
- Health-check endpoint at `GET /api/health`.
- Separated Express application configuration from server startup for testability.
- MVC-oriented server directory structure.
- Initial project documentation and implementation status tracker.
