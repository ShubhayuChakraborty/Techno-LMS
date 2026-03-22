const FINE_RATE_PER_DAY = 5; // ₹5 per day

/**
 * Calculate fine amount based on due date and return date
 * @param {Date|string} dueDate
 * @param {Date|string} returnDate - defaults to now
 * @returns {number} fine amount in ₹
 */
const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  if (returned <= due) return 0;
  const diffMs = returned - due;
  const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return overdueDays * FINE_RATE_PER_DAY;
};

/**
 * Calculate overdue days
 * @param {Date|string} dueDate
 * @param {Date|string} returnDate - defaults to now
 * @returns {number}
 */
const calculateOverdueDays = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  if (returned <= due) return 0;
  return Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
};

module.exports = { calculateFine, calculateOverdueDays, FINE_RATE_PER_DAY };
