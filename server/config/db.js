const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  pool = mysql.createPool({
    host:     url.hostname,
    port:     parseInt(url.port) || 3306,
    user:     url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    waitForConnections: true,
    connectionLimit: 10,
  });
} else {
  pool = mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "clinica_veterinaria",
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = pool;