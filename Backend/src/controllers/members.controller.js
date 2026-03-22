const membersService = require("../services/members.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const data = await membersService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const search = asyncHandler(async (req, res) => {
  const members = await membersService.search(req.query.q);
  res.status(200).json(new ApiResponse(200, members));
});

const getById = asyncHandler(async (req, res) => {
  const member = await membersService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, member));
});

const create = asyncHandler(async (req, res) => {
  const member = await membersService.create(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, member, "Member registered successfully."));
});

const update = asyncHandler(async (req, res) => {
  const member = await membersService.update(req.params.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, member, "Member updated successfully."));
});

const toggleActive = asyncHandler(async (req, res) => {
  const member = await membersService.toggleActive(req.params.id);
  const msg = member.isActive ? "Member activated." : "Member deactivated.";
  res.status(200).json(new ApiResponse(200, member, msg));
});

const remove = asyncHandler(async (req, res) => {
  await membersService.remove(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Member deleted successfully."));
});

const getMemberBorrows = asyncHandler(async (req, res) => {
  const data = await membersService.getMemberBorrows(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const getMemberFines = asyncHandler(async (req, res) => {
  const data = await membersService.getMemberFines(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, data));
});

module.exports = {
  getAll,
  search,
  getById,
  create,
  update,
  toggleActive,
  remove,
  getMemberBorrows,
  getMemberFines,
};
