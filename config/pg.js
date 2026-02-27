import { config } from "dotenv";
config();
import { Pool } from "pg";

const { NODE_ENV, PG_HOST, PG_PORT, PG_DB_LOCAL, PG_USER, PG_PASS } = process.env;

let pool;

if (NODE_ENV === "production") {
  pool = new Pool({
    connectionString: "",
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    user: PG_USER,
    password: PG_PASS,
    port: PG_PORT,
    host: PG_HOST,
    database: PG_DB_LOCAL,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
  });
}

(async () => {
  try {
    const client = await pool.connect();
    console.log("pg database connected successfully");
  } catch (err) {
    console.log(`pg database connection failed`, err);
    process.exit(1);
  }
})();

pool.on("error", err => {
  console.error("Unexpected PG error", err);
  process.exit(1);
});

export default pool;
