# Setu Library

A full-stack library management application.

## Overview

This repository contains both the client and server components of the Setu Library application.

- **Client**: A modern Next.js frontend application built with React, Zustand for state management, and Framer Motion for animations.
- **Server**: A robust Express.js backend API built with TypeScript, integrated with MongoDB via Mongoose, and featuring JWT-based authentication and web push notifications.

## Project Structure

- `/client`: Next.js frontend application.
- `/server`: Node.js/Express backend application.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB instance (Local or Atlas)

## Getting Started

### 1. Server Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Set up your environment variables by copying the example file:

```bash
cp .env.example .env
```
*(Make sure to fill in your MongoDB URI, JWT secrets, and other configuration variables in the `.env` file)*

Run the development server:

```bash
npm run dev
```

### 2. Client Setup

Open a new terminal window and navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Set up your environment variables by copying the example file:

```bash
cp .env.local.example .env.local
```

Run the development server:

```bash
npm run dev
```

The client will typically start on `http://localhost:3000`.

## Scripts

### Client (`/client`)
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the Next.js production server.

### Server (`/server`)
- `npm run dev`: Starts the Express server in development mode with hot-reloading (`ts-node-dev`).
- `npm run build`: Compiles TypeScript code to JavaScript in the `dist/` folder.
- `npm run start`: Runs the compiled JavaScript application.
- `npm run seed`: Runs the database seeding script to populate initial data.

## Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Zustand](https://github.com/pmndrs/zustand) (State Management)
- [Framer Motion](https://www.framer.com/motion/) (Animations)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/) (Authentication)
- [Web Push](https://github.com/web-push-libs/web-push) (Notifications)
