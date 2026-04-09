# Batuan National High School — SSLG Voting & Management System

A web-based voting system for the Supreme Student Learner Government (SSLG) election at Batuan National High School.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js (Node.js)
- **Database**: MySQL

## Getting Started

### Prerequisites

- Node.js & npm
- MySQL Server

### 1. Set up the database

```sql
mysql -u root -p < server/schema.sql
```

### 2. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=batuan_voting
```

### 3. Install dependencies

```sh
# Frontend
npm install

# Backend
cd server
npm install
```

### 4. Run the application

```sh
# Start backend (from /server)
npm run dev

# Start frontend (from root)
npm run dev
```

## Default Admin Credentials

| Field    | Value                |
|----------|----------------------|
| Email    | `admin@bnhs.edu.ph`  |
| Password | `admin123`           |

> **Note:** These credentials are seeded automatically when you run `schema.sql`. Change the password after your first login.
