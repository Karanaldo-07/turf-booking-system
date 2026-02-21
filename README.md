# Football Turf Booking System

Full-stack football turf booking platform with JWT auth, admin dashboard, booking conflict prevention, pricing controls, and Razorpay-compatible payment flow (with mock fallback).

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose

## Project Structure
```
.
├── client
└── server
```

---

## Run Locally (Step by Step)

### 0) Prerequisites
Install these first:
- Node.js **18+** and npm
- MongoDB (local service or MongoDB Atlas URI)
- Git

Optional (for real payments):
- Razorpay test key ID and secret

---

### 1) Clone and enter the project
```bash
git clone <your-repo-url>
cd turf-booking-system
```

---

### 2) Backend setup (`server`)
Open terminal #1:

```bash
cd server
cp .env.example .env
npm install
```

Now edit `server/.env` and confirm values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/turf_booking
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_example
RAZORPAY_KEY_SECRET=replace_with_secret
CLIENT_URL=http://localhost:5173
```

> If you do not have Razorpay keys yet, you can keep placeholders; booking still works using mock order fallback.

Seed initial data (sample turfs + admin):

```bash
npm run seed
```

Start backend dev server:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

### 3) Frontend setup (`client`)
Open terminal #2:

```bash
cd client
cp .env.example .env
npm install
```

Ensure `client/.env` has:

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend dev server:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### 4) Login credentials (seeded admin)
After running `npm run seed` in `server`:
- Email: `admin@turf.com`
- Password: `admin123`

Use this account to access `/admin`.

---

### 5) How to use the app quickly
1. Register a normal user account from `/register`.
2. Browse turfs on home page.
3. Pick date/time slot and create booking.
4. Booking gets payment-confirmed through simulated flow.
5. Login as admin and manage turfs, prices, and booking status.

---

## Common Troubleshooting

### npm install fails
- Check Node/npm versions: `node -v && npm -v`
- Clear npm cache: `npm cache clean --force`
- Retry with clean install:
  - delete `node_modules` and lockfile
  - run `npm install` again

### MongoDB connection error
- Ensure MongoDB service is running locally
- Or set Atlas connection string in `MONGO_URI`

### CORS / API not reachable
- Confirm backend `CLIENT_URL=http://localhost:5173`
- Confirm frontend `VITE_API_URL=http://localhost:5000/api`
- Restart both servers after env changes

---

## Quick Start Commands (copy/paste)

Terminal #1:
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

Terminal #2:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
