# Vaccination Drive Management Platform

A production-ready vaccination drive platform for online registration, Razorpay payment collection, admin payment approval, PDF receipt generation, user dashboards, and operational Excel exports.

## Features

- JWT authentication with refresh-token cookies
- Optional Google OAuth login
- Protected user, admin, and staff routes
- Vaccination registration with unique registration IDs
- Razorpay order creation and signature verification
- Admin payment approval/rejection workflow
- PDF receipt generation after admin approval
- User dashboard with approved receipt download
- Admin dashboard with payment queue, user lookup, and Excel exports
- JSON-file storage with Render persistent disk support
- Helmet, CORS, rate limiting, bcrypt password hashing, and role guards

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- Backend: Node.js, Express.js, Passport, JWT, Razorpay, PDFKit, ExcelJS
- Storage: JSON files
- Deployment: Vercel frontend, Render backend

## Folder Structure

```text
.
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docs/
│   └── api_documentation.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── pages/
│   └── package.json
├── .env.example
├── .gitignore
├── render.yaml
└── README.md
```

## Environment Variables

Create `.env` in the repository root from `.env.example`.

```env
PORT=
NODE_ENV=
CLIENT_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Operational note: for the first Render deployment, set `ADMIN_PASSWORD` in the Render dashboard if the persistent data disk does not already contain an admin user. Do not commit admin passwords or private OAuth JSON files.

## Local Development

Install backend dependencies:

```bash
cd backend
npm install
npm start
```

Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Production Deployment

### Backend on Render

- Use `render.yaml`.
- Render service root is `backend`.
- Build command: `npm ci`
- Start command: `npm start`
- Attach a persistent disk at `/var/data`.
- Set required secrets in the Render dashboard.
- Set `CLIENT_URL` to the deployed Vercel frontend URL.

### Frontend on Vercel

- Project root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed Render API URL ending in `/api`, for example:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## Screenshots

Add production screenshots here after deployment:

- Landing page
- Registration form
- Razorpay checkout
- User dashboard
- Admin payment queue
- Receipt PDF

## Security Notes

- `.env`, generated receipts, local JSON data, logs, and private credential folders are ignored.
- JWT secrets are required; fallback secrets are not used.
- Google OAuth uses environment variables only.
- Razorpay signature verification runs server-side.
- Receipts are available only after admin approval.

## Future Improvements

- Move from JSON storage to a managed database for high concurrency.
- Add email delivery for password reset links and payment notifications.
- Add automated end-to-end browser tests for deployment smoke checks.
- Add CI with lint, build, dependency audit, and secret scanning.
