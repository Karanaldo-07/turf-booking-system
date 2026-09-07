# Football Turf Booking System

A full-stack, mobile-friendly football turf booking platform built with React, Express, MongoDB and Razorpay.

## Features

- User registration and login with JWT authentication
- Responsive turf discovery and booking flow
- Date and hourly slot selection
- Server-side availability validation and double-booking protection
- Temporary 15-minute booking holds while payment is completed
- Razorpay order creation and server-side payment signature verification
- Booking history and cancellation
- Admin dashboard for turf and booking management
- Turf activation/deactivation and pricing controls
- MongoDB-backed data persistence
- Production-oriented environment configuration
- GitHub Actions CI for frontend builds and backend syntax checks

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router
- **Backend:** Node.js 22+, Express.js
- **Database:** MongoDB + Mongoose
- **Payments:** Razorpay Standard Checkout
- **Authentication:** JWT + bcrypt

## Project Structure

```text
.
├── client/                 # React/Vite frontend
├── server/                 # Express API
│   ├── api/                # Vercel serverless entrypoint
│   └── src/
└── .github/workflows/      # CI checks
```

## Local Setup

### Prerequisites

- Node.js **22.2+** and npm
- MongoDB locally or a MongoDB Atlas connection string
- Git
- Razorpay test keys for real payment testing

### 1. Clone

```bash
git clone <your-repo-url>
cd turf-booking-system
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
npm install
```

Set these values in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/turf_booking
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
ALLOW_MOCK_PAYMENTS=false
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-strong-password
```

Never commit `.env` or real API keys to GitHub.

### 3. Seed sample data

```bash
npm run seed
```

The seed script creates sample turfs and an admin account using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from your local environment.

### 4. Start the API

```bash
npm run dev
```

API: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

### 5. Configure the frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
```

Set:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Payments

The production flow is:

1. The API validates the turf and selected slot.
2. The API creates a Razorpay order.
3. The frontend opens Razorpay Checkout.
4. Razorpay returns payment details to the frontend.
5. The API verifies the Razorpay signature and payment/order amount server-side.
6. Only after successful verification is the booking marked paid and approved.

Mock payments are disabled by default. For local UI-only development, set `ALLOW_MOCK_PAYMENTS=true`; never enable this in production.

## Deployment Plan

Deployment is intentionally the final step after the GitHub project passes CI and the application has been tested end-to-end.

Recommended production components:

- React frontend deployed on Vercel
- Express API deployed as a Vercel serverless function or a dedicated Node service
- MongoDB Atlas for production database
- Razorpay Live/Test keys stored only as platform environment variables

No secrets should be stored in source control.

## CI

Every push to `main` runs:

- frontend dependency installation
- frontend production build
- backend dependency installation
- JavaScript syntax checks

See `.github/workflows/ci.yml`.
