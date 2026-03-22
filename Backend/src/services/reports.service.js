const prisma = require("../config/db");

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getLastNMonthKeys = (n = 12) => {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(formatMonthKey(d));
  }
  return keys;
};

const getSummary = async () => {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalBooks,
    totalMembers,
    activeMembers,
    activeBorrows,
    overdueBorrows,
    returnsToday,
    totalFinesResult,
    collectedFinesResult,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.member.count(),
    prisma.member.count({ where: { isActive: true } }),
    prisma.borrow.count({
      where: { returned: false, dueDate: { gte: new Date() } },
    }),
    prisma.borrow.count({
      where: { returned: false, dueDate: { lt: new Date() } },
    }),
    prisma.borrow.count({
      where: { returned: true, returnedAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.fine.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["unpaid", "pending"] } },
    }),
    prisma.fine.aggregate({
      _sum: { amount: true },
      where: { status: "paid" },
    }),
  ]);

  return {
    totalBooks,
    totalMembers,
    activeMembers,
    activeBorrows,
    overdueBorrows,
    returnsToday,
    pendingFines: Number(totalFinesResult._sum.amount || 0),
    collectedFines: Number(collectedFinesResult._sum.amount || 0),
  };
};

const getMonthlyBorrows = async () => {
  const records = await prisma.borrow.findMany({
    where: {
      borrowDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: { borrowDate: true, returnedAt: true },
  });

  const monthMap = {};
  for (const r of records) {
    const month = formatMonthKey(r.borrowDate);
    if (!monthMap[month]) monthMap[month] = { borrows: 0, returns: 0 };
    monthMap[month].borrows++;
    if (r.returnedAt) {
      const retMonth = formatMonthKey(r.returnedAt);
      if (!monthMap[retMonth]) monthMap[retMonth] = { borrows: 0, returns: 0 };
      monthMap[retMonth].returns++;
    }
  }

  return getLastNMonthKeys(12).map((month) => ({
    month,
    borrows: monthMap[month]?.borrows || 0,
    returns: monthMap[month]?.returns || 0,
  }));
};

const getCategoryStats = async () => {
  const books = await prisma.book.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return books.map((b) => ({ category: b.category, count: b._count.id }));
};

const getPopularBooks = async (limit = 8) => {
  const result = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: Number(limit),
  });

  const bookIds = result.map((r) => r.bookId);
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

  // O(1) lookup map instead of O(n²) Array.find inside map
  const countMap = new Map(result.map((r) => [r.bookId, r._count.id]));
  return books.map((book) => ({
    ...book,
    borrowCount: countMap.get(book.id) || 0,
  }));
};

const getMemberGrowth = async () => {
  const members = await prisma.member.findMany({
    where: {
      joinedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: { joinedAt: true },
  });

  const monthMap = {};
  for (const m of members) {
    const month = formatMonthKey(m.joinedAt);
    monthMap[month] = (monthMap[month] || 0) + 1;
  }

  return getLastNMonthKeys(12).map((month) => ({
    month,
    members: monthMap[month] || 0,
  }));
};

const getDashboard = async () => {
  const [totalBooks, totalBorrows, collectedFinesResult, overdueMembers] =
    await Promise.all([
      prisma.book.count(),
      prisma.borrow.count(),
      prisma.fine.aggregate({
        _sum: { amount: true },
        where: { status: "paid" },
      }),
      prisma.member.count({
        where: { unpaidFines: { gt: 0 }, isActive: true },
      }),
    ]);

  return {
    totalBooks,
    totalBorrows,
    finesCollected: Number(collectedFinesResult._sum.amount || 0),
    overdueMembers,
  };
};

const getAdminAnalytics = async () => {
  const [summary, monthlyBorrows, categoryStats, popularBooks, memberGrowth] =
    await Promise.all([
      getSummary(),
      getMonthlyBorrows(),
      getCategoryStats(),
      getPopularBooks(8),
      getMemberGrowth(),
    ]);

  const totalBorrowsYear = monthlyBorrows.reduce(
    (sum, m) => sum + m.borrows,
    0,
  );
  const avgBorrowsPerMonth = Number((totalBorrowsYear / 12).toFixed(2));
  const joinedThisMonth = memberGrowth[memberGrowth.length - 1]?.members || 0;

  return {
    summary,
    analytics: {
      booksCirculated: totalBorrowsYear,
      activeMembers: summary.activeMembers,
      avgBorrowsPerMonth,
      finesCollected: summary.collectedFines,
      joinedThisMonth,
    },
    monthlyBorrows,
    categoryStats,
    memberGrowth,
    popularBooks,
  };
};

module.exports = {
  getDashboard,
  getAdminAnalytics,
  getSummary,
  getMonthlyBorrows,
  getCategoryStats,
  getPopularBooks,
  getMemberGrowth,
};
