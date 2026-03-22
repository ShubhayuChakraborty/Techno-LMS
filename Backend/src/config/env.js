require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";

module.exports = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || process.env.JWT_REFRESH_SECRET,
    // Secure cookies only in production; lax SameSite in dev to allow cross-port requests
    secure: nodeEnv === "production",
    sameSite: nodeEnv === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  // Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://myapp.com"
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim()),
  // Domain restriction: only emails from this domain can register
  allowedEmailDomain:
    process.env.ALLOWED_EMAIL_DOMAIN || "technoindiaeducation.com",
  // SMTP config for sending OTP emails
  email: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      "noreply@technoindiaeducation.com",
  },
  // Google OAuth client ID (for verifying ID tokens from the frontend)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },
  // Gemini AI for recommendations
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  // Razorpay payments
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
};
