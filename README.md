# Secure Notes API

REST API for a note-taking platform with JWT authentication and role-based access control (User / Admin).

**Live API:** https://notes-backend-1-t9kp.onrender.com
(Free hosting: the first request after inactivity can take 30-60 seconds.)

## Tech
Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs.

## Roles
- **User:** create, update, delete, list own notes. Write posts. View all posts.
- **Admin:** everything a user can do, plus manage users (add, update, delete, list) and view everyone's notes.

## Setup
Install dependencies:

    npm install

Create a `.env` file with:

    MONGO_URI=<mongodb connection string>
    JWT_SECRET=<long random string>
    PORT=5000
    ADMIN_EMAIL=<first admin email>
    ADMIN_PASSWORD=<first admin password>

Create the first admin, then start the server:

    node scripts/seedAdmin.js
    node server.js

Registration never accepts a role, so the first admin is created only by the seed script.

## Endpoints
All list endpoints take `?page=1&limit=10` (limit capped at 50).

| Method | Path | Access |
|---|---|---|
| POST | /auth/register | public |
| POST | /auth/login | public |
| GET | /users/me | logged in |
| GET | /users/interests?interest=chess | logged in (Aggregation 1) |
| GET | /users/:id/posts | public (Aggregation 2) |
| POST, GET | /notes | own notes |
| GET, PUT, DELETE | /notes/:id | own notes |
| POST | /posts | logged in |
| GET | /posts | public |
| GET, POST | /admin/users | admin |
| GET, PUT, DELETE | /admin/users/:id | admin |
| GET | /admin/notes?owner=USER_ID | admin |

## Security
- Passwords are hashed with bcrypt (cost 10). The hash is never returned (select: false, and stripped from create responses).
- JWT is sent in the `Authorization: Bearer <token>` header. The `auth` middleware verifies it and `requireRole("admin")` guards admin routes.
- Every note query includes `owner: req.user.id`, so users cannot read or change other users' notes.

## Indexes (defined with schema.index)
Only indexes that a real query needs:

| Index | Supports |
|---|---|
| User `{ email: 1 }` unique | Login lookup, duplicate email protection |
| User `{ interests: 1 }` (multikey) | `$match` stage of the interests aggregation when filtering by `?interest=` |
| Note `{ owner: 1, _id: -1 }` | "My notes" list (filter by owner, newest first, paginated); also the admin `?owner=` filter |
| Post `{ author: 1, _id: -1 }` | `$lookup` join on `author` and a user's post list |

No extra indexes on purpose:
- Single GETs (user profile, one note) use the default `_id` index.
- Admin user list, admin all-notes list and the public post list sort by `_id`, which the default `_id` index already covers.

Pagination uses `skip` / `limit` with a capped limit on every list.

## Aggregations
1. **Users grouped by interest** (`GET /users/interests`): one `User.aggregate()` call: `$match` (optional, uses the interests index), `$unwind`, `$group`, `$sort`, `$skip` / `$limit`, `$project`.
2. **All posts of a user** (`GET /users/:id/posts`): one pipeline: `$match` (by `_id`), `$lookup` into `posts` (sub-pipeline for sort and pagination, served by the `{ author, _id }` index), `$project`.