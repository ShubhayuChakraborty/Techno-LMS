const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/db");

const start = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to Neon PostgreSQL");

    app.listen(env.port, () => {
      console.log(` Server running on http://localhost:${env.port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
      console.log(`   API Base:    http://localhost:${env.port}/api/v1`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("\n Server stopped.");
  process.exit(0);
});

start();
