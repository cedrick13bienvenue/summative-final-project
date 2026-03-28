import { execSync } from "child_process";
import * as path from "path";

console.log("📊 Running database migrations...");

try {
  execSync("npx sequelize-cli db:migrate", {
    stdio: "inherit",
    cwd: path.join(__dirname, "..", ".."),
  });
  console.log("✅ Database migrations completed successfully");
} catch (error: any) {
  console.error("❌ Database migration failed:", error.message);
  process.exit(1);
}
