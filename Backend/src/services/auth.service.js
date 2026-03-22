const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const emailService = require("./email.service");

// ─── In-memory login-attempt tracking ────────────────────────────────────────
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function checkLockout(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const mins = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    throw new ApiError(
      429,
      `Account temporarily locked. Try again in ${mins} minute(s).`,
    );
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(email);
  }
}

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCKOUT_MS;
  loginAttempts.set(email, entry);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const signAccessToken = (id, role) =>
  jwt.sign({ id, role }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

const signRefreshToken = (id) => {
  const jti = crypto.randomBytes(32).toString("hex");
  return jwt.sign({ id, jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
};

// ─── Domain restriction ───────────────────────────────────────────────────────

function validateEmailDomain(email) {
  const domain = env.allowedEmailDomain;
  if (!email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
    throw new ApiError(
      400,
      `Only @${domain} email addresses are allowed to register.`,
    );
  }
}

// ─── OTP helpers ─────────────────────────────────────────────────────────────

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyOtpRecord(email, code, type) {
  const record = await prisma.otp.findFirst({
    where: { email, type, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (!record)
    throw new ApiError(400, "No pending OTP found. Please request a new one.");
  if (record.expiresAt < new Date())
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  if (record.code !== code) throw new ApiError(400, "Invalid OTP code.");
  return record;
}

// ─── Register (internal — called after OTP verification) ─────────────────────

const register = async ({
  name,
  email,
  password,
  role = "member",
  phone,
  address,
  membershipType,
  expiryDate,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Email already registered.");

  if (
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and contain both letters and numbers.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, passwordHash, role },
    });

    if (role === "member") {
      const count = await tx.member.count();
      const membershipNo = `LIB-${String(count + 1).padStart(6, "0")}`;
      const expiry = expiryDate
        ? new Date(expiryDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await tx.member.create({
        data: {
          userId: newUser.id,
          name,
          email,
          phone: phone || "",
          membershipNo,
          address: address || "",
          membershipType: membershipType || "basic",
          expiryDate: expiry,
        },
      });
    }

    return newUser;
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

// ─── Send registration OTP ────────────────────────────────────────────────────

const sendRegistrationOtp = async (email, name) => {
  validateEmailDomain(email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    throw new ApiError(409, "An account with this email already exists.");

  // Remove previously sent (unused) OTPs for this email/type
  await prisma.otp.deleteMany({ where: { email, type: "registration" } });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await prisma.otp.create({
    data: { email, code, type: "registration", expiresAt },
  });

  await emailService.sendOtpEmail(email, name, code, "registration");
};

// ─── Verify OTP & complete registration ───────────────────────────────────────

const verifyAndRegister = async ({ email, otp, name, password }) => {
  validateEmailDomain(email);

  const record = await verifyOtpRecord(email, otp, "registration");

  // Mark OTP used & create account atomically
  await prisma.otp.update({ where: { id: record.id }, data: { used: true } });

  return register({ name, email, password, role: "member" });
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (email, password) => {
  checkLockout(email);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { member: true },
  });

  // Constant-time comparison — prevent timing-based enumeration
  const hashToCompare =
    user?.passwordHash ||
    "$2a$12$invalidhashplaceholder000000000000000000000000000";
  const passwordValid = user?.passwordHash
    ? await bcrypt.compare(password, hashToCompare)
    : false;

  if (!user || !passwordValid) {
    recordFailedAttempt(email);
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.role === "member" && user.member && !user.member.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Contact the library.",
    );
  }

  clearAttempts(email);

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, refreshToken, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      member: user.member
        ? {
            id: user.member.id,
            membershipNo: user.member.membershipNo,
            avatarColor: user.member.avatarColor,
          }
        : null,
    },
  };
};

// ─── Refresh (token rotation) ─────────────────────────────────────────────────

const refresh = async (token) => {
  if (!token) throw new ApiError(401, "Refresh token required.");

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new ApiError(401, "User no longer exists.");

  const newRefreshToken = signRefreshToken(user.id);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.session.delete({ where: { id: session.id } }),
    prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: newRefreshToken,
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  await prisma.session.deleteMany({ where: { refreshToken } });
};

// ─── Get current user ─────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: true, librarian: true },
  });
  if (!user) throw new ApiError(404, "User not found.");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    member: user.member
      ? {
          id: user.member.id,
          name: user.member.name,
          email: user.member.email,
          phone: user.member.phone,
          address: user.member.address,
          membershipNo: user.member.membershipNo,
          membershipType: user.member.membershipType,
          expiryDate: user.member.expiryDate,
          isActive: user.member.isActive,
          activeBorrows: user.member.activeBorrows,
          unpaidFines: user.member.unpaidFines,
          totalBorrows: user.member.totalBorrows,
          avatarColor: user.member.avatarColor,
          avatarUrl: user.member.avatarUrl,
          joinedAt: user.member.joinedAt,
        }
      : null,
    librarian: user.librarian
      ? {
          id: user.librarian.id,
          name: user.librarian.name,
          email: user.librarian.email,
          phone: user.librarian.phone,
          address: user.librarian.address,
          department: user.librarian.department,
          avatarColor: user.librarian.avatarColor,
          avatarUrl: user.librarian.avatarUrl,
          createdAt: user.librarian.createdAt,
        }
      : null,
  };
};

// ─── Change password ──────────────────────────────────────────────────────────

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found.");

  if (!user.passwordHash) {
    throw new ApiError(
      400,
      "This account uses Google sign-in. Use forgot password to set a password.",
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect.");

  if (
    newPassword.length < 8 ||
    !/[a-zA-Z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and contain both letters and numbers.",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
};

// ─── Update profile ───────────────────────────────────────────────────────────

const updateProfile = async (userId, data) => {
  const { name, phone, address, department, avatarColor, avatarUrl } = data;

  // Fetch the user with relations to know which profile tables to update
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: true, librarian: true },
  });
  if (!user) throw new ApiError(404, "User not found.");

  // Update the User row only when name changed
  if (name !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { name } });
  }

  // Update Member profile if one exists
  if (user.member) {
    const memberUpdates = {};
    if (name !== undefined) memberUpdates.name = name;
    if (phone !== undefined) memberUpdates.phone = phone;
    if (address !== undefined) memberUpdates.address = address;
    if (avatarColor !== undefined) memberUpdates.avatarColor = avatarColor;
    if (avatarUrl !== undefined) memberUpdates.avatarUrl = avatarUrl;
    if (Object.keys(memberUpdates).length) {
      await prisma.member.update({ where: { userId }, data: memberUpdates });
    }
  }

  // Update Librarian profile — upsert so it works even if the row doesn't exist yet
  if (user.role === "librarian" || user.role === "admin") {
    const librarianData = {};
    if (name !== undefined) librarianData.name = name;
    if (phone !== undefined) librarianData.phone = phone;
    if (address !== undefined) librarianData.address = address;
    if (department !== undefined) librarianData.department = department;
    if (avatarColor !== undefined) librarianData.avatarColor = avatarColor;
    if (avatarUrl !== undefined) librarianData.avatarUrl = avatarUrl;
    if (Object.keys(librarianData).length) {
      await prisma.librarian.upsert({
        where: { userId },
        update: librarianData,
        create: {
          userId,
          name: name ?? user.name,
          email: user.email,
          ...librarianData,
        },
      });
    }
  }

  return getMe(userId);
};

// ─── Forgot password — send OTP ───────────────────────────────────────────────

const sendPasswordResetOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration attacks
  if (!user) return;

  await prisma.otp.deleteMany({ where: { email, type: "password_reset" } });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await prisma.otp.create({
    data: { email, code, type: "password_reset", expiresAt },
  });

  await emailService.sendOtpEmail(email, user.name, code, "password_reset");
};

// ─── Reset password with OTP ──────────────────────────────────────────────────

const resetPassword = async (email, otp, newPassword) => {
  const record = await verifyOtpRecord(email, otp, "password_reset");

  if (
    newPassword.length < 8 ||
    !/[a-zA-Z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and contain both letters and numbers.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) throw new ApiError(404, "User not found.");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.otp.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const googleAuth = async (idToken) => {
  if (!env.google.clientId) {
    throw new ApiError(
      503,
      "Google authentication is not configured on this server.",
    );
  }

  const { OAuth2Client } = require("google-auth-library");
  const client = new OAuth2Client(env.google.clientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired Google token. Please try again.",
    );
  }

  const { email, name, sub: googleId } = payload;

  // Only allow organisation email domain
  validateEmailDomain(email);

  // Find by googleId first, then fall back to email match for account linking
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    include: { member: true },
  });

  if (!user) {
    // Auto-provision a new member account
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash: null, googleId, role: "member" },
      });

      const count = await tx.member.count();
      const membershipNo = `LIB-${String(count + 1).padStart(6, "0")}`;
      const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await tx.member.create({
        data: {
          userId: newUser.id,
          name,
          email,
          phone: "",
          membershipNo,
          address: "",
          membershipType: "basic",
          expiryDate: expiry,
        },
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { member: true },
      });
    });
  } else if (!user.googleId) {
    // Link Google account to existing email-password account
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
      include: { member: true },
    });
  }

  if (user.role === "member" && user.member && !user.member.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Contact the library.",
    );
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId: user.id, refreshToken, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      member: user.member
        ? {
            id: user.member.id,
            membershipNo: user.member.membershipNo,
            avatarColor: user.member.avatarColor,
          }
        : null,
    },
  };
};

// ─── Register Librarian (admin-only) ─────────────────────────────────────────

const registerLibrarian = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Email already registered.");

  if (
    !password ||
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and contain both letters and numbers.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, passwordHash, role: "librarian" },
    });
    await tx.librarian.create({
      data: { userId: newUser.id, name, email },
    });
    return newUser;
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  updateProfile,
  sendRegistrationOtp,
  verifyAndRegister,
  sendPasswordResetOtp,
  resetPassword,
  googleAuth,
  registerLibrarian,
};
