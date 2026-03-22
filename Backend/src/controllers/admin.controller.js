const adminService = require("../services/admin.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  const profile = await adminService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, profile));
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await adminService.updateProfile(req.user.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully."));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await adminService.changePassword(req.user.id, currentPassword, newPassword);
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

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
