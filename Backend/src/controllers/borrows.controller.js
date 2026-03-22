const borrowsService = require("../services/borrows.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const data = await borrowsService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const getById = asyncHandler(async (req, res) => {
  const record = await borrowsService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, record));
});

const getOverdue = asyncHandler(async (req, res) => {
  const records = await borrowsService.getOverdue();
  res.status(200).json(new ApiResponse(200, records));
});

const issue = asyncHandler(async (req, res) => {
  const { memberId, bookId, borrowDays } = req.body;
  const record = await borrowsService.issue(memberId, bookId, borrowDays);
  res
    .status(201)
    .json(new ApiResponse(201, record, "Book issued successfully."));
});

const returnBook = asyncHandler(async (req, res) => {
  const result = await borrowsService.returnBook(req.params.id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const extend = asyncHandler(async (req, res) => {
  const record = await borrowsService.extend(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, record, "Borrow extended by 7 days."));
});

const syncOverdue = asyncHandler(async (req, res) => {
  const result = await borrowsService.syncOverdueStatus();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `${result.count} records marked as overdue.`,
      ),
    );
});

module.exports = {
  getAll,
  getById,
  getOverdue,
  issue,
  returnBook,
  extend,
  syncOverdue,
};
