import { execSync } from "child_process";
import * as path from "path";

console.log("🗄️ Creating database if it doesn't exist...");

try {
  // Try to create the database
  execSync("npx sequelize-cli db:create", {
    stdio: "inherit",
    cwd: path.join(__dirname, "..", ".."),
  });
  console.log("✅ Database created successfully");
} catch (error: any) {
  if (error.message.includes("already exists")) {
    console.log("ℹ️  Database already exists, continuing...");
  } else {
    console.error("❌ Database creation failed:", error.message);
    console.log("⚠️  Continuing with migrations...");
  }
}
