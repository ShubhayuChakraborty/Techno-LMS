const reportsService = require("../services/reports.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await reportsService.getDashboard();
  res.status(200).json(new ApiResponse(200, data));
});

const getAdminAnalytics = asyncHandler(async (req, res) => {
  const data = await reportsService.getAdminAnalytics();
  res.status(200).json(new ApiResponse(200, data));
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await reportsService.getSummary();
  res.status(200).json(new ApiResponse(200, data));
});

const getMonthlyBorrows = asyncHandler(async (req, res) => {
  const data = await reportsService.getMonthlyBorrows();
  res.status(200).json(new ApiResponse(200, data));
});

const getCategoryStats = asyncHandler(async (req, res) => {
  const data = await reportsService.getCategoryStats();
  res.status(200).json(new ApiResponse(200, data));
});

const getPopularBooks = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const data = await reportsService.getPopularBooks(limit);
  res.status(200).json(new ApiResponse(200, data));
});

const getMemberGrowth = asyncHandler(async (req, res) => {
  const data = await reportsService.getMemberGrowth();
  res.status(200).json(new ApiResponse(200, data));
});

module.exports = {
  getDashboard,
  getAdminAnalytics,
  getSummary,
  getMonthlyBorrows,
  getCategoryStats,
  getPopularBooks,
  getMemberGrowth,
};
