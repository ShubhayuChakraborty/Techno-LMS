const crypto = require("crypto");

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I to avoid confusion
const CODE_LENGTH = 5;

/**
 * Generates a unique borrow code in the format LIB-XXXXX.
 * Uses cryptographically secure random bytes so codes are unpredictable.
 * Example output: LIB-3K9X2
 * @returns {string}
 */
function generateBorrowCode() {
  let code = "";
  // Use rejection sampling to ensure uniform distribution over CHARSET
  while (code.length < CODE_LENGTH) {
    const byte = crypto.randomBytes(1)[0];
    // Accept only values that map uniformly into CHARSET length (32 chars)
    if (byte < 256 - (256 % CHARSET.length)) {
      code += CHARSET[byte % CHARSET.length];
    }
  }
  return `LIB-${code}`;
}

module.exports = { generateBorrowCode };
