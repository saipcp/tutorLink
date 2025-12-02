import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  let connection;

  try {
    const dbName = process.env.DB_NAME || "tutorlink";
    
    // Step 1: Connect without database first to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "3306"),
    });

    console.log("✅ Connected to MySQL server");

    // Step 2: Create database if it doesn't exist
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' ready`);
    } catch (error) {
      console.log(`⚠️  Database creation: ${error.message}`);
    }

    // Step 3: Close and reconnect to the specific database
    await connection.end();

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      port: parseInt(process.env.DB_PORT || "3306"),
    });

    console.log(`✅ Connected to database '${dbName}'`);

    // Step 4: Read and parse schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    let schema = fs.readFileSync(schemaPath, "utf8");

    // Process line by line to remove comments and unwanted statements
    const lines = schema.split("\n");
    const processedLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip full-line comments and empty lines
      if (trimmed.startsWith("--") || trimmed.length === 0) {
        continue;
      }
      
      // Skip CREATE DATABASE and USE statements
      if (trimmed.match(/^(CREATE\s+DATABASE|USE)\s+/i)) {
        continue;
      }
      
      // Remove inline comments
      const commentIndex = line.indexOf("--");
      if (commentIndex >= 0) {
        processedLines.push(line.substring(0, commentIndex).trim());
      } else {
        processedLines.push(line.trim());
      }
    }
    
    // Join back into a single string
    schema = processedLines.join("\n");

    // Split into individual statements by semicolon
    const rawStatements = schema.split(";");
    const statements = rawStatements
      .map((s) => s.trim())
      .filter((s) => {
        // Filter out empty statements
        if (s.length === 0) return false;
        // Filter out any remaining fragments that might have been missed
        if (s.match(/^(CREATE\s+DATABASE|USE)\s+/i)) return false;
        // Only keep statements that look like valid SQL
        if (!s.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)/i)) return false;
        return true;
      });

    console.log(`📝 Found ${statements.length} statements to execute`);

    // Step 5: Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.query(statement + ";");
        const preview = statement.substring(0, 60).replace(/\s+/g, " ");
        console.log(`✅ [${i + 1}/${statements.length}] Executed: ${preview}...`);
      } catch (error) {
        // Ignore "already exists" errors for tables and other objects
        if (
          error.message.includes("already exists") ||
          error.message.includes("Duplicate") ||
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DUP_KEYNAME" ||
          error.code === "ER_DUP_FIELDNAME"
        ) {
          const preview = statement.substring(0, 60).replace(/\s+/g, " ");
          console.log(`⚠️  [${i + 1}/${statements.length}] Already exists: ${preview}...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
          console.error(`   Code: ${error.code}`);
          console.error(`   Statement preview: ${statement.substring(0, 150).replace(/\s+/g, " ")}...`);
          // Continue with other statements even if one fails
        }
      }
    }

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();