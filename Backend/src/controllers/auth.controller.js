const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

// Cookie options for the HTTP-only refresh-token cookie
const refreshCookieOptions = () => ({
  httpOnly: true, // Inaccessible to JavaScript — prevents XSS token theft
  secure: env.cookie.secure, // HTTPS-only in production
  sameSite: env.cookie.sameSite,
  maxAge: env.cookie.maxAge,
  path: "/",
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  path: "/",
});

// POST /auth/register
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, user, "Registration successful."));
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(
    email,
    password,
  );

  // Place the refresh token in an HTTP-only cookie — never expose it to JS
  res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken, user }, "Login successful."));
});

// POST /auth/refresh   (refresh token read from HTTP-only cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refresh(token);

  // Rotate: set the new refresh token cookie
  res.cookie("refreshToken", newRefreshToken, refreshCookieOptions());

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Token refreshed."));
});

// POST /auth/logout   (refresh token read from HTTP-only cookie)
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await authService.logout(token);

  // Clear the cookie by setting maxAge to 0
  res.clearCookie("refreshToken", clearCookieOptions());

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully."));
});

// GET /auth/me   (requires valid access token via Bearer header)
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json(new ApiResponse(200, user));
});

// PUT /auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  // All sessions were revoked — clear the current refresh cookie too
  res.clearCookie("refreshToken", clearCookieOptions());

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully. Please log in again.",
      ),
    );
});

// PATCH /auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully."));
});

// POST /auth/send-registration-otp
const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  await authService.sendRegistrationOtp(email, name);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "OTP sent to your email. Check your inbox (or console in dev mode).",
      ),
    );
});

// POST /auth/verify-and-register
const verifyAndRegister = asyncHandler(async (req, res) => {
  const user = await authService.verifyAndRegister(req.body);
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user,
        "Registration successful! You can now log in.",
      ),
    );
});

// POST /auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.sendPasswordResetOtp(email);
  // Always return 200 to prevent email enumeration
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If this email is registered, an OTP has been sent.",
      ),
    );
});

// POST /auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successfully. You can now log in.",
      ),
    );
});

// POST /auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const { accessToken, refreshToken, user } =
    await authService.googleAuth(idToken);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
  res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken, user }, "Google sign-in successful."),
    );
});

// POST /auth/register-librarian  (admin only)
const registerLibrarian = asyncHandler(async (req, res) => {
  const user = await authService.registerLibrarian(req.body);
  res
    .status(201)
    .json(
      new ApiResponse(201, user, "Librarian account created successfully."),
    );
});

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
  forgotPassword,
  resetPassword,
  googleAuth,
  registerLibrarian,
};
