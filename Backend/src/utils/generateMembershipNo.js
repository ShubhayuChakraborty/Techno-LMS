/**
 * Generate a unique membership number in format LIB-XXXXXX
 * @param {number} count - current total member count
 * @returns {string}
 */
const generateMembershipNo = (count) => {
  const padded = String(count + 1).padStart(6, "0");
  return `LIB-${padded}`;
};

module.exports = { generateMembershipNo };
