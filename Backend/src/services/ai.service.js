const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

// Use gemini-2.0-flash-lite: higher free-tier RPM/RPD than gemini-2.0-flash
const GEMINI_MODEL = "gemini-2.0-flash-lite";
// Max candidates sent to Gemini — fewer tokens = less quota consumed per request
const MAX_CANDIDATES = 20;
// Max retries on 429
const MAX_RETRIES = 2;

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!env.geminiApiKey) {
      throw new ApiError(500, "GEMINI_API_KEY is not configured.");
    }
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return genAI;
}

/** Extract the retry-after seconds from a Gemini 429 error, default 60s. */
function getRetryDelay(err) {
  try {
    const detail = err.errorDetails?.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
    );
    if (detail?.retryDelay) {
      return (parseInt(detail.retryDelay, 10) || 60) * 1000;
    }
  } catch {
    /* ignore */
  }
  return 60_000;
}

/** Call fn(), retrying up to MAX_RETRIES times on 429. */
async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err.status === 429 && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(err);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        break;
      }
    }
  }
  // Surface a clean message instead of the raw Gemini stack
  if (lastErr?.status === 429) {
    throw new ApiError(
      429,
      "Gemini API rate limit reached. Please wait a moment and try again.",
    );
  }
  throw lastErr;
}

/**
 * Given a member's borrow history + list of candidate books,
 * ask Gemini to recommend up to `limit` books with a reason and match score.
 */
async function generateRecommendations(
  memberProfile,
  candidateBooks,
  limit = 5,
) {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  // Keep prompt small: truncate borrowed list and cap candidates
  const borrowedList = memberProfile.borrowedTitles.length
    ? memberProfile.borrowedTitles.slice(0, 10).join(", ")
    : "none";

  const favoriteGenres =
    memberProfile.genres.slice(0, 4).join(", ") || "general";

  // Send at most MAX_CANDIDATES books to save tokens
  const catalog = candidateBooks.slice(0, MAX_CANDIDATES);
  const booksCatalog = catalog
    .map(
      (b, i) =>
        `${i + 1}.[${b.id}]"${b.title}" by ${b.author} (${b.category}, ★${b.rating})`,
    )
    .join("\n");

  const prompt = `Library recommendation engine. Member "${memberProfile.name}" likes: ${favoriteGenres}. Previously read: ${borrowedList}.

Catalog:
${booksCatalog}

Pick ${limit} best matches for this member (not already read). Reply ONLY valid JSON array:
[{"bookId":"<id>","score":0.85,"reason":"<max 12 words>","strategy":"<content_based|genre_match|highly_rated|trending|collaborative_filtering>"}]`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ApiError(
        500,
        "Gemini returned invalid JSON: " + text.slice(0, 200),
      );
    }
    if (!Array.isArray(parsed))
      throw new ApiError(500, "Gemini response is not an array.");
    return parsed.slice(0, limit);
  });
}

/**
 * Ask Gemini to summarise trending patterns across all members.
 */
async function generateTrendingInsight(topBooks) {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  const list = topBooks
    .slice(0, 5)
    .map(
      (b, i) => `${i + 1}. "${b.title}" (${b.borrows} borrows, ★${b.rating})`,
    )
    .join(", ");

  const prompt = `Library top books this month: ${list}. Write 2 sentences about reading trends. Be concise and data-driven.`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
}

// ─── Algorithmic Fallback (no Gemini needed) ─────────────────────────────────
/**
 * Pure-JS recommendation scoring used when Gemini is rate-limited.
 * Scores each candidate by genre match, normalised rating, and a small
 * random jitter for diversity. Returns the same shape as generateRecommendations().
 */
function generateRecommendationsFallback(
  memberProfile,
  candidateBooks,
  limit = 5,
) {
  const topGenres = new Set(
    memberProfile.genres.slice(0, 4).map((g) => g.toLowerCase()),
  );

  const scored = candidateBooks.map((b) => {
    const genreHit = topGenres.has((b.category || "").toLowerCase());
    const ratingScore = (parseFloat(b.rating) || 3) / 5; // 0–1
    const score = Math.min(
      0.99,
      (genreHit ? 0.4 : 0) + ratingScore * 0.45 + Math.random() * 0.1 + 0.05,
    );
    const strategy = genreHit
      ? "genre_match"
      : ratingScore > 0.8
        ? "highly_rated"
        : "content_based";
    const reason = genreHit
      ? `Matches your interest in ${b.category}.`
      : `Highly rated ${b.category} book by ${b.author}.`;

    return {
      bookId: b.id,
      score: parseFloat(score.toFixed(3)),
      reason,
      strategy,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Fallback trending insight derived purely from DB data — no API call. */
function generateTrendingInsightFallback(topBooks) {
  if (!topBooks.length) return "No trending data available yet.";
  const top = topBooks[0];
  const categories = [...new Set(topBooks.map((b) => b.category))].slice(0, 3);
  return `"${top.title}" leads this month with ${top.borrows} borrows. Members show strong interest in ${categories.join(", ")} titles, highlighting a diverse and active reading community.`;
}

module.exports = {
  generateRecommendations,
  generateTrendingInsight,
  generateRecommendationsFallback,
  generateTrendingInsightFallback,
};
