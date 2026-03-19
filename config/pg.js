import { config } from "dotenv";
config();
import { Pool } from "pg";

// const { NODE_ENV, PG_HOST, PG_PORT, PG_DB_LOCAL, PG_USER, PG_PASS } = process.env;

const {
  NODE_ENV,
  DOCKER_PG_HOST,
  DOCKER_PG_PORT,
  DOCKER_PG_DB,
  DOCKER_PG_USER,
  DOCKER_PG_PASS,
} = process.env;

let pool;

if (NODE_ENV === "production") {
  pool = new Pool({
    connectionString: "",
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    user: DOCKER_PG_USER,
    password: DOCKER_PG_PASS,
    port: DOCKER_PG_PORT,
    host: DOCKER_PG_HOST,
    database: DOCKER_PG_DB,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
  });
}

(async () => {
  try {
    await pool.connect();
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
