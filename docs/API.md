# OpenAA Marketplace - API Documentation

## Authentication

All protected endpoints require an `Authorization: Bearer <token>` header where the token is the Supabase session access token.

## Endpoints

### Auth

#### `POST /api/auth/register`
Register a new user.

**Body:**
```json
{ "email": "user@example.com", "password": "password123", "username": "username" }
```

#### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{ "email": "user@example.com", "password": "password123" }
```

#### `POST /api/auth/logout`
Logout current user.

#### `GET /api/auth/session`
Get current session.

### User Profile

#### `GET /api/user/profile`
Get authenticated user's profile. Requires auth.

#### `PUT /api/user/profile`
Update authenticated user's profile. Requires auth.

**Body:**
```json
{ "username": "new_name", "bio": "About me", "phone": "123-456-7890" }
```

### Secondhand Items

#### `GET /api/secondhand`
List published items with pagination.

**Query params:** `category`, `page`, `pageSize`

#### `POST /api/secondhand`
Create a new item. Requires auth.

**Body:**
```json
{ "title": "Item name", "description": "Details", "price": 50, "category": "电子产品", "images": [] }
```

#### `GET /api/secondhand/[id]`
Get a specific item.

#### `PUT /api/secondhand/[id]`
Update an item. Requires auth (owner only).

#### `DELETE /api/secondhand/[id]`
Delete an item. Requires auth (owner only).

### Job Postings

#### `GET /api/jobs`
List published jobs with pagination.

**Query params:** `category`, `job_type`, `page`, `pageSize`

#### `POST /api/jobs`
Create a new job posting. Requires auth.

#### `GET /api/jobs/[id]`
Get a specific job posting.

#### `PUT /api/jobs/[id]`
Update a job posting. Requires auth (owner only).

#### `DELETE /api/jobs/[id]`
Delete a job posting. Requires auth (owner only).
