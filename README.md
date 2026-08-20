# URL Shortener

A full-stack URL shortener with click tracking, link expiry, and Redis-backed caching for fast redirects. Built with React (Vite) on the frontend and Express + MongoDB + Redis on the backend.

🔗 **Live demo:** [url-shortener-chi-opal.vercel.app](https://url-shortener-chi-opal.vercel.app)

## Features

- Shorten any valid URL into a compact short code
- Fast redirects via a Redis cache-aside layer in front of MongoDB
- Automatic link expiry (TTL-based, enforced by both MongoDB and Redis)
- Click count tracking per short URL
- List and delete existing short URLs
- Input validation (Joi) and rate limiting on URL creation (10 requests/minute)
- Centralized error handling middleware

## Tech Stack

**Frontend**
- React 19
- Vite

**Backend**
- Node.js / Express 5
- MongoDB with Mongoose
- Redis (cache-aside pattern for redirects)
- Joi (request validation)
- express-rate-limit

## How It Works

1. A client submits a URL to `POST /api/urls`, which is validated and rate-limited before a random short code is generated and stored in MongoDB with an expiry timestamp.
2. On redirect (`GET /:shortCode`), the server first checks Redis for a cached entry.
   - **Cache hit:** validity is checked against the cached expiry, the click count is incremented in MongoDB, and the user is redirected.
   - **Cache miss:** MongoDB is queried, the click count is incremented, and — if the link hasn't expired — the result is cached in Redis with a TTL matching its remaining lifetime before redirecting.
3. Expired links return a `410 Gone` response instead of redirecting.

## Project Structure

```
url-shortener/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       ├── index.css / App.css
│       └── assets/
└── server/                  # Express backend
    ├── config/
    │   ├── db.js             # MongoDB connection
    │   └── redis.js          # Redis client + connection
    ├── controllers/
    │   └── urlController.js  # Create, redirect, list, delete logic
    ├── middleware/
    │   ├── errorHandler.js
    │   └── validateUrl.js
    ├── models/
    │   └── URL.js             # Mongoose schema
    ├── routes/
    │   └── urlRoutes.js
    └── server.js
```

## API Reference

| Method | Endpoint             | Description                              |
|--------|-----------------------|-------------------------------------------|
| POST   | `/api/urls`           | Create a short URL (`{ originalUrl }`)    |
| GET    | `/api/urls`           | List all short URLs                       |
| DELETE | `/api/urls/:id`       | Delete a short URL by its MongoDB `_id`   |
| GET    | `/:shortCode`         | Redirect to the original URL              |

**Example: create a short URL**

```bash
curl -X POST http://localhost:5000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/some/very/long/path"}'
```

```json
{
  "originalUrl": "https://example.com/some/very/long/path",
  "shortCode": "a1b2c3d4",
  "shortUrl": "http://localhost:5000/a1b2c3d4"
}
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or Atlas)
- Redis instance (local or hosted, e.g. Upstash/Redis Cloud)

### 1. Clone the repo

```bash
git clone https://github.com/Mand4l0rian/url-shortener.git
cd url-shortener
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
BASE_URL=http://localhost:5000
```

Run the server:

```bash
npm run dev     # with nodemon
# or
npm start
```

### 3. Set up the client

```bash
cd ../client
npm install
npm run dev
```

The client will start on Vite's default port (typically `http://localhost:5173`) and the API on `http://localhost:5000`.

## License

ISC
