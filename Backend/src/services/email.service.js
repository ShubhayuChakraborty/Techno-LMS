const nodemailer = require("nodemailer");
const env = require("../config/env");

// ─── Transporter ─────────────────────────────────────────────────────────────
// In development without SMTP config, fall back to console logging so the app
// still works without an email provider.

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { host, port, secure, user, pass } = env.email;
  if (!host || !user || !pass) {
    return null; // dev mode — log to console
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: env.nodeEnv === "production" },
  });

  return _transporter;
}

// ─── Email templates ──────────────────────────────────────────────────────────

function registrationTemplate(name, code) {
  return {
    subject: "Your Registration OTP — Techno India Library",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e5e5">
        <h2 style="color:#C8102E;margin:0 0 8px">Techno India University</h2>
        <p style="color:#666;font-size:13px;margin:0 0 24px">Library Management System</p>
        <p style="color:#333">Hello <strong>${name}</strong>,</p>
        <p style="color:#333">Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="display:inline-block;background:#C8102E;color:#fff;font-size:36px;font-weight:700;letter-spacing:8px;padding:16px 32px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#999;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>
    `,
    text: `Your Techno India Library OTP is: ${code}\nExpires in 10 minutes.`,
  };
}

function passwordResetTemplate(name, code) {
  return {
    subject: "Password Reset OTP — Techno India Library",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e5e5">
        <h2 style="color:#C8102E;margin:0 0 8px">Techno India University</h2>
        <p style="color:#666;font-size:13px;margin:0 0 24px">Library Management System</p>
        <p style="color:#333">Hello <strong>${name}</strong>,</p>
        <p style="color:#333">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="display:inline-block;background:#FF9F0A;color:#fff;font-size:36px;font-weight:700;letter-spacing:8px;padding:16px 32px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#999;font-size:12px">If you did not request a password reset, your account is safe — ignore this email.</p>
      </div>
    `,
    text: `Your Techno India Library password reset OTP is: ${code}\nExpires in 10 minutes.`,
  };
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────

const sendOtpEmail = async (toEmail, name, code, type) => {
  const template =
    type === "registration"
      ? registrationTemplate(name, code)
      : passwordResetTemplate(name, code);

  const transporter = getTransporter();

  if (!transporter) {
    // Development fallback: print OTP to console instead of sending email
    console.log("\n────── [DEV] OTP EMAIL ──────");
    console.log(`  To      : ${toEmail}`);
    console.log(`  Type    : ${type}`);
    console.log(`  OTP     : ${code}`);
    console.log("────────────────────────────\n");
    return;
  }

  await transporter.sendMail({
    from: `"Techno India Library" <${env.email.from}>`,
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

module.exports = { sendOtpEmail };
