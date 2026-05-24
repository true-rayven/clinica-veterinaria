const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool(
  process.env.DATABASE_URL || {
    host:     process.env.DB_HOST     || "localhost",
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "clinica_veterinaria",
    waitForConnections: true,
    connectionLimit: 10,
  }
);

module.exports = pool;