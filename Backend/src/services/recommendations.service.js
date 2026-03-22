const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const aiService = require("./ai.service");

const REC_INCLUDE = {
  book: {
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      category: true,
      rating: true,
      availableCopies: true,
      description: true,
    },
  },
  member: { select: { id: true, name: true, membershipNo: true } },
};

const getAll = async ({ memberId = "", page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = memberId ? { memberId } : {};

  const [total, recommendations] = await Promise.all([
    prisma.recommendation.count({ where }),
    prisma.recommendation.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { score: "desc" },
      include: REC_INCLUDE,
    }),
  ]);

  return {
    recommendations,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const create = async ({ bookId, memberId, score, strategy, reason }) => {
  const [book, member] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId } }),
    prisma.member.findUnique({ where: { id: memberId } }),
  ]);
  if (!book) throw new ApiError(404, "Book not found.");
  if (!member) throw new ApiError(404, "Member not found.");

  return prisma.recommendation.create({
    data: { bookId, memberId, score, strategy, reason },
    include: REC_INCLUDE,
  });
};

const remove = async (id) => {
  const rec = await prisma.recommendation.findUnique({ where: { id } });
  if (!rec) throw new ApiError(404, "Recommendation not found.");
  await prisma.recommendation.delete({ where: { id } });
};

// ─── AI-Powered Methods ────────────────────────────────────────────────────

/**
 * Generate AI recommendations for a single member using Gemini.
 * Deletes old AI recommendations for the member, then creates fresh ones.
 */
const generateAIForMember = async (memberId, count = 5) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      borrowRecords: {
        include: {
          book: { select: { id: true, title: true, category: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: 30,
      },
    },
  });
  if (!member) throw new ApiError(404, "Member not found.");

  // Build member profile
  const borrowedBookIds = member.borrowRecords.map((r) => r.book.id);
  const borrowedTitles = member.borrowRecords.map((r) => r.book.title);
  const genreCounts = {};
  for (const r of member.borrowRecords) {
    genreCounts[r.book.category] = (genreCounts[r.book.category] || 0) + 1;
  }
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  // Get candidate books (not already borrowed, available)
  const candidates = await prisma.book.findMany({
    where: {
      availableCopies: { gt: 0 },
      id: { notIn: borrowedBookIds },
    },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      rating: true,
      description: true,
    },
    take: 40,
    orderBy: { rating: "desc" },
  });

  if (candidates.length === 0) {
    return { recommendations: [], message: "No available books to recommend." };
  }

  // Call Gemini; fall back to local algorithm on quota/rate errors
  let aiRecs;
  try {
    aiRecs = await aiService.generateRecommendations(
      { name: member.name, genres, borrowedTitles },
      candidates,
      count,
    );
  } catch (err) {
    if (err.statusCode === 429 || err.status === 429) {
      aiRecs = aiService.generateRecommendationsFallback(
        { name: member.name, genres, borrowedTitles },
        candidates,
        count,
      );
    } else {
      throw err;
    }
  }

  // Delete existing AI recs for this member (strategy contains "ai" or "gemini")
  await prisma.recommendation.deleteMany({
    where: {
      memberId,
      strategy: {
        in: [
          "collaborative_filtering",
          "content_based",
          "trending",
          "genre_match",
          "highly_rated",
        ],
      },
    },
  });

  // Validate bookIds returned by Gemini against our actual candidates
  const validIds = new Set(candidates.map((b) => b.id));
  const toCreate = aiRecs.filter((r) => validIds.has(r.bookId));

  // Persist recommendations
  // Bulk-insert in one query instead of N individual INSERTs
  await prisma.recommendation.createMany({
    data: toCreate.map((r) => ({
      bookId: r.bookId,
      memberId,
      score: Math.min(1, Math.max(0, Number(r.score) || 0.75)),
      strategy: r.strategy || "content_based",
      reason: r.reason || null,
    })),
    skipDuplicates: true,
  });

  const created = await prisma.recommendation.findMany({
    where: { memberId, bookId: { in: toCreate.map((r) => r.bookId) } },
    orderBy: { score: "desc" },
    include: REC_INCLUDE,
  });

  return {
    recommendations: created,
    member: { id: member.id, name: member.name },
  };
};

/**
 * Bulk-generate AI recommendations for all active members (up to 50 to avoid quota limits).
 */
const generateAIForAll = async (countPerMember = 3) => {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    take: 50,
    orderBy: { totalBorrows: "desc" },
  });

  const results = [];
  for (const m of members) {
    try {
      const res = await generateAIForMember(m.id, countPerMember);
      results.push({
        memberId: m.id,
        name: m.name,
        count: res.recommendations.length,
      });
    } catch (err) {
      results.push({ memberId: m.id, name: m.name, error: err.message });
    }
  }
  return results;
};

/**
 * Get high-level stats: total recs generated, total members with recs,
 * average score, trending insight from Gemini.
 */
const getAIStats = async () => {
  const [totalRecs, membersWithRecs, avgScoreRow, topBooks] = await Promise.all(
    [
      prisma.recommendation.count(),
      prisma.recommendation.groupBy({ by: ["memberId"] }).then((r) => r.length),
      prisma.recommendation.aggregate({ _avg: { score: true } }),
      // Top 8 most borrowed books this month
      prisma.borrowRecord.groupBy({
        by: ["bookId"],
        _count: { bookId: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 8,
      }),
    ],
  );

  // Fetch book details for top books
  const bookIds = topBooks.map((b) => b.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      rating: true,
      coverUrl: true,
    },
  });
  const borrowCountMap = Object.fromEntries(
    topBooks.map((b) => [b.bookId, b._count.bookId]),
  );
  const trendingBooks = books
    .map((b) => ({
      ...b,
      borrows: borrowCountMap[b.id] || 0,
    }))
    .sort((a, b) => b.borrows - a.borrows);

  // Get trending insight from Gemini; degrade gracefully on quota errors
  let trendingInsight = "";
  try {
    trendingInsight = await aiService.generateTrendingInsight(
      trendingBooks.slice(0, 5),
    );
  } catch (err) {
    trendingInsight =
      err.statusCode === 429 || err.status === 429
        ? aiService.generateTrendingInsightFallback(trendingBooks.slice(0, 5))
        : "Unable to generate insight at this time.";
  }

  return {
    totalRecommendations: totalRecs,
    membersWithRecommendations: membersWithRecs,
    averageScore: avgScoreRow._avg.score
      ? parseFloat(Number(avgScoreRow._avg.score).toFixed(2))
      : 0,
    trendingBooks,
    trendingInsight,
  };
};

/**
 * Get personalised recommendations for the logged-in member.
 * Auto-generates via AI (with fallback) if none exist yet —
 * so the member never has to press a button.
 *
 * Also returns trending books so the member page can show
 * a "Trending" row like Netflix.
 */
const getForMe = async (memberId) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true },
  });
  if (!member) throw new ApiError(404, "Member not found.");

  // Fetch existing recommendations
  let recs = await prisma.recommendation.findMany({
    where: { memberId },
    orderBy: { score: "desc" },
    take: 10,
    include: REC_INCLUDE,
  });

  // Auto-generate if none exist (first visit — like Netflix on signup)
  if (recs.length === 0) {
    try {
      const generated = await generateAIForMember(memberId, 6);
      recs = generated.recommendations;
    } catch {
      recs = [];
    }
  }

  // Trending books (most borrowed, for the "Trending" shelf)
  const topBorrows = await prisma.borrowRecord.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 8,
  });
  const trendingIds = topBorrows.map((b) => b.bookId);
  const trendingBooks = await prisma.book.findMany({
    where: { id: { in: trendingIds }, availableCopies: { gt: 0 } },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      rating: true,
      coverUrl: true,
      availableCopies: true,
      description: true,
    },
  });
  const borrowMap = Object.fromEntries(
    topBorrows.map((b) => [b.bookId, b._count.bookId]),
  );
  const trending = trendingBooks
    .map((b) => ({ ...b, borrows: borrowMap[b.id] || 0 }))
    .sort((a, b) => b.borrows - a.borrows);

  return { recommendations: recs, trending, member };
};

module.exports = {
  getAll,
  create,
  remove,
  generateAIForMember,
  generateAIForAll,
  getAIStats,
  getForMe,
};
