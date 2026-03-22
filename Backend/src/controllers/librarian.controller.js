const librarianService = require("../services/librarian.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/v1/librarian
const getAll = asyncHandler(async (req, res) => {
  const data = await librarianService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

// GET /api/v1/librarian/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await librarianService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, profile));
});

// PATCH /api/v1/librarian/profile
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await librarianService.updateProfile(req.user.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile updated successfully."));
});

module.exports = { getAll, getProfile, updateProfile };
