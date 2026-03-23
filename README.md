# Techno-LMS

A full-stack Library Management System (LMS) built as a university software engineering project, with role-based workflows for Admin, Librarian, and Member users.

## Live Deployment

- Frontend: https://techno-lms-frontend.vercel.app/
- Backend API: https://techno-lms-backend.vercel.app/

## Table of Contents

- [Techno-LMS](#techno-lms)
  - [Live Deployment](#live-deployment)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Core Features](#core-features)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [Repository Structure](#repository-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [1) Clone the repository](#1-clone-the-repository)
    - [2) Setup Backend](#2-setup-backend)
    - [3) Setup Frontend](#3-setup-frontend)
  - [Environment Variables](#environment-variables)
    - [Backend required](#backend-required)
    - [Backend commonly used (recommended)](#backend-commonly-used-recommended)
    - [Frontend commonly used](#frontend-commonly-used)
  - [Available Scripts](#available-scripts)
    - [Backend (`Backend/package.json`)](#backend-backendpackagejson)
    - [Frontend (`Frontend/package.json`)](#frontend-frontendpackagejson)
  - [API Notes](#api-notes)
  - [Deployment](#deployment)
  - [Contributing](#contributing)

## Project Overview

Techno-LMS is a monorepo with:

- `Frontend/`: Next.js 16 application (TypeScript)
- `Backend/`: Express.js REST API with Prisma ORM

The platform supports:

- Authentication with access token + refresh token strategy
- Role-based access control (`admin`, `librarian`, `member`)
- Book and member management
- Borrow request and approval workflow
- Fines and reporting modules
- Avatar/image uploads and profile management

## Core Features

- Role-based dashboards for Admin, Librarian, and Member
- Borrow lifecycle: request, approve/decline, issue, return
- Search and filtering across members, books, and borrows
- Notification feed for borrow events
- Profile management with avatar uploads
- Reporting views and export-friendly data handling

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Axios
- Tailwind CSS
- Radix UI + Lucide Icons

### Backend

- Node.js + Express
- Prisma ORM
- PostgreSQL / Neon
- JWT authentication
- Zod validation
- Multer + Cloudinary for uploads

## Repository Structure

```text
.
├── Frontend/                 # Next.js client app
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── lib/
├── Backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── config/
│   └── prisma/
└── README.md
```

## Getting Started

### Prerequisites

- Node.js `>=18`
- npm `>=9`
- PostgreSQL database (or Neon connection string)

### 1) Clone the repository

```bash
git clone https://github.com/ShubhayuChakraborty/Techno-LMS.git
cd Techno-LMS
```

### 2) Setup Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` using the variables listed below.

Run Prisma setup:

```bash
npm run db:generate
npm run db:push
```

Start backend:

```bash
npm run dev
```

Backend default local URL: `http://localhost:4000`

### 3) Setup Frontend

```bash
cd ../Frontend
npm install
```

Create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Start frontend:

```bash
npm run dev
```

Frontend default local URL: `http://localhost:3000`

## Environment Variables

### Backend required

From backend runtime validation:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### Backend commonly used (recommended)

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `COOKIE_SAME_SITE`
- `ALLOWED_EMAIL_DOMAIN`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend commonly used

- `NEXT_PUBLIC_API_URL`

## Available Scripts

### Backend (`Backend/package.json`)

- `npm run dev` — start API in watch mode
- `npm run start` — start API in production mode
- `npm run db:push` — sync Prisma schema to DB
- `npm run db:migrate` — run Prisma migrations (dev)
- `npm run db:seed` — seed DB
- `npm run db:studio` — open Prisma Studio
- `npm run db:generate` — regenerate Prisma client

### Frontend (`Frontend/package.json`)

- `npm run dev` — start Next.js dev server
- `npm run build` — create production build
- `npm run start` — run production build
- `npm run lint` — run ESLint

## API Notes

- Base URL (prod): `https://techno-lms-backend.vercel.app/api/v1`
- Health endpoint: `GET /api/v1/health`
- Auth endpoints live under `/api/v1/auth`
- Upload endpoints live under `/api/v1/upload`

## Deployment

- Frontend and backend are deployed separately on Vercel.
- Ensure frontend `NEXT_PUBLIC_API_URL` points to backend `/api/v1` base.
- Ensure backend `ALLOWED_ORIGINS` includes frontend domain.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit with clear messages
4. Open a pull request with testing notes

---

Maintained by the Techno-LMS project team.
