const { ZodError } = require("zod");

/**
 * Middleware factory for Zod schema validation
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - part of req to validate
 */
const validate = (schema, source = "body") => {
  return (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return _res.status(422).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }
      next(err);
    }
  };
};

module.exports = { validate };
