import { defineConfig } from "prisma/config";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
