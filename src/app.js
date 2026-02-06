// app.js
import 'dotenv/config'; // MUST BE LINE 1 - Loads your .env variables
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import routes from './routes.js';

const app = express();

// --- Debugging (Optional: Remove after testing) ---
console.log("✅ Env Loaded. Cloudinary Key exists:", !!process.env.CLOUDINARY_API_KEY);
// --------------------------------------------------

app.use(helmet());

// CORS configuration - read allowed origins from environment for security
// Prefer `ALLOWED_ORIGINS` as a comma-separated list. Fallback to CLIENT_URL
// or NEXT_PUBLIC_API_URL for backwards compatibility. Only add localhost
// origins during development.
const allowedOrigins = (() => {
  const fromEnv = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const list = fromEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    // keep local dev origins when not in production
    list.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  // remove duplicates
  return Array.from(new Set(list));
})();

console.log("CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools or same-origin (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS policy: This origin is not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiter to prevent brute force on Login/API
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { message: "Too many requests, please try again later." }
});
app.use('/api', limiter);

// API Routes
app.use('/api', routes);

// Global Health Check
app.get('/', (req, res) => res.json({ ok: true, status: "Server is running" }));

// Global Error Handler - Prevents the 500 error from crashing the whole server process
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack);
  res.status(500).json({ 
    message: err.message || "Something went wrong on the server" 
  });
});

export default app;