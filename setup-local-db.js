// Setup local MySQL database
const mysql = require("mysql2/promise");
require("dotenv").config();

async function setupLocalDatabase() {
  // Connect without database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log("✓ Connected to MySQL server!");

    // Create database if not exists
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "kasport"}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(
      `✓ Database '${process.env.DB_NAME || "kasport"}' created/verified!`
    );

    console.log("\n=== Local MySQL Setup Complete! ===");
    console.log(`Database: ${process.env.DB_NAME || "kasport"}`);
    console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`User: ${process.env.DB_USER || "root"}`);
    console.log("\nYou can now use MySQL Workbench with these credentials:");
    console.log("- Connection: localhost:3306");
    console.log(`- Username: ${process.env.DB_USER || "root"}`);
    console.log(`- Password: ${process.env.DB_PASSWORD || "123456"}`);
    console.log(`- Default Schema: ${process.env.DB_NAME || "kasport"}`);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupLocalDatabase();
