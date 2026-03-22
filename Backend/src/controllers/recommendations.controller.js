const recsService = require("../services/recommendations.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const data = await recsService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, data));
});

const create = asyncHandler(async (req, res) => {
  const rec = await recsService.create(req.body);
  res.status(201).json(new ApiResponse(201, rec, "Recommendation created."));
});

const remove = asyncHandler(async (req, res) => {
  await recsService.remove(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Recommendation deleted."));
});

// ─── AI-Powered Endpoints ─────────────────────────────────────────────────

const getAIStats = asyncHandler(async (req, res) => {
  const stats = await recsService.getAIStats();
  res.status(200).json(new ApiResponse(200, stats));
});

const generateForMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const count = Math.min(parseInt(req.query.count || "5", 10), 10);
  const result = await recsService.generateAIForMember(memberId, count);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Generated ${result.recommendations.length} AI recommendations.`,
      ),
    );
});

const generateForAll = asyncHandler(async (req, res) => {
  const countPerMember = Math.min(parseInt(req.query.count || "3", 10), 5);
  const results = await recsService.generateAIForAll(countPerMember);
  const total = results.reduce((s, r) => s + (r.count || 0), 0);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { results, total },
        `Generated ${total} AI recommendations across ${results.length} members.`,
      ),
    );
});

// ─── Member Self-Service Endpoint ─────────────────────────────────────────
// GET /recommendations/me  – returns personalised recs + trending books for
// the logged-in member; auto-generates them on first visit (no button needed)
const getForMe = asyncHandler(async (req, res) => {
  const memberId = req.user?.member?.id;
  if (!memberId) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "Member profile not found."));
  }
  const data = await recsService.getForMe(memberId);
  res.status(200).json(new ApiResponse(200, data));
});

module.exports = {
  getAll,
  create,
  remove,
  getAIStats,
  generateForMember,
  generateForAll,
  getForMe,
};
