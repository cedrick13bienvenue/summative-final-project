import { sequelize } from './src/database/config/database';

async function clearDatabaseData() {
  try {
    console.log("🗑️  Starting database data cleanup...");

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get list of all tables in the database
      const [tables] = await sequelize.query(
        `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'SequelizeMeta'
        ORDER BY table_name
      `,
        { transaction }
      );

      console.log(
        "📋 Found tables:",
        tables.map((t: any) => t.table_name).join(", ")
      );

      // Disable foreign key checks temporarily
      console.log("🔓 Temporarily disabling foreign key checks...");
      await sequelize.query("SET session_replication_role = replica;", {
        transaction,
      });

      // Clear all tables
      for (const table of tables as any[]) {
        const tableName = table.table_name;
        console.log(`🗑️  Clearing ${tableName}...`);
        await sequelize.query(`DELETE FROM "${tableName}"`, { transaction });
      }

      // Re-enable foreign key checks
      console.log("🔒 Re-enabling foreign key checks...");
      await sequelize.query("SET session_replication_role = DEFAULT;", {
        transaction,
      });

      // Clear users but keep admin (if users table exists)
      const usersTable = (tables as any[]).find((t) => t.table_name === "users");
      if (usersTable) {
        console.log("👥 Clearing users (keeping admin)...");
        await sequelize.query(
          "DELETE FROM users WHERE email != 'admin@medconnect.com'",
          { transaction }
        );
      }

      // Commit transaction
      await transaction.commit();

      console.log("✅ Database data cleared successfully!");
      console.log("👤 Admin user preserved: admin@medconnect.com");
      console.log("🔑 Admin password: admin123!@#");
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Error clearing database data:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
clearDatabaseData();
