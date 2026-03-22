const booksService = require("../services/books.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const data = await booksService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const search = asyncHandler(async (req, res) => {
  const books = await booksService.search(req.query.q);
  res.status(200).json(new ApiResponse(200, books));
});

const getById = asyncHandler(async (req, res) => {
  const book = await booksService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, book));
});

const create = asyncHandler(async (req, res) => {
  const book = await booksService.create(req.body);
  res.status(201).json(new ApiResponse(201, book, "Book added successfully."));
});

const update = asyncHandler(async (req, res) => {
  const book = await booksService.update(req.params.id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, book, "Book updated successfully."));
});

const remove = asyncHandler(async (req, res) => {
  await booksService.remove(req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Book deleted successfully."));
});

module.exports = { getAll, search, getById, create, update, remove };
