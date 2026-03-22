const finesService = require("../services/fines.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const data = await finesService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const getById = asyncHandler(async (req, res) => {
  const fine = await finesService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, fine));
});

const pay = asyncHandler(async (req, res) => {
  const fine = await finesService.pay(req.params.id);
  res.status(200).json(new ApiResponse(200, fine, "Fine paid successfully."));
});

const waive = asyncHandler(async (req, res) => {
  const fine = await finesService.waive(req.params.id);
  res.status(200).json(new ApiResponse(200, fine, "Fine waived successfully."));
});

const payAll = asyncHandler(async (req, res) => {
  const result = await finesService.payAll(req.params.memberId);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `${result.paidCount} fine(s) paid. Total: ₹${result.totalAmount}`,
      ),
    );
});

const getMyFines = asyncHandler(async (req, res) => {
  const data = await finesService.getMyFines(req.user.id);
  res.status(200).json(new ApiResponse(200, data));
});

const payMine = asyncHandler(async (req, res) => {
  // Verify the fine belongs to the authenticated member
  const fine = await finesService.getById(req.params.id);
  if (req.user.role === "member") {
    const prisma = require("../config/db");
    const member = await prisma.member.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!member || fine.memberId !== member.id) {
      const ApiError = require("../utils/ApiError");
      throw new ApiError(403, "You can only pay your own fines.");
    }
  }
  const updated = await finesService.pay(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, updated, "Fine paid successfully."));
});

const payMyAll = asyncHandler(async (req, res) => {
  const result = await finesService.payAllForMember(
    req.user.role === "member" ? req.user.id : null,
    req.params.memberId,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `${result.paidCount} fine(s) paid. Total: ₹${result.totalAmount}`,
      ),
    );
});

module.exports = {
  getAll,
  getById,
  pay,
  waive,
  payAll,
  getMyFines,
  payMine,
  payMyAll,
};
