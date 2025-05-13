# Secure Notes Frontend

This is the frontend for the Secure Notes application, built with Next.js 14 and Tailwind CSS.

## Features

- User authentication (login, registration)
- Create, view, edit, and delete notes
- Support for encrypted notes
- User profile management
- Responsive design

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A running instance of the [Secure Notes API backend](../secure-api-backend) 

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/secure-note-api.git
cd secure-note-api/secure-note-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```
Replace the `NEXT_PUBLIC_API_URL` with the URL of your backend API if it's not running at the default location.

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Production Build
```bash
npm run build
npm start
```

## Project Structure

- `src/app` - Next.js 14 app directory with pages and routes
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and context providers
- `src/services` - API service layer
- `src/types` - TypeScript type definitions

## Authentication Flow

The frontend uses a token-based authentication system:

1. User logs in with username and password
2. Backend returns a JWT token
3. Token is stored in localStorage
4. Token is included in Authorization header for protected API requests

## Routes

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/notes` - List of user's notes
- `/notes/new` - Create a new note
- `/notes/[id]` - View a specific note
- `/notes/[id]/edit` - Edit a specific note
- `/profile` - User profile management

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- React Hook Form with Zod validation
- Axios for API requests
- date-fns for date formatting

## License

MIT
