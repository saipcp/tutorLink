import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function rollback() {
  let connection;

  try {
    const dbName = process.env.DB_NAME || "tutorlink";
    
    // Step 1: Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "3306"),
    });

    console.log("✅ Connected to MySQL server");

    // Step 2: Drop database if it exists
    try {
      await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`✅ Database '${dbName}' dropped`);
    } catch (error) {
      console.log(`⚠️  Database drop: ${error.message}`);
    }

    // Step 3: Close connection and exit
    await connection.end();
    console.log("✅ Rollback completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Rollback failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

rollback();

