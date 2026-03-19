import { config } from "dotenv";
config();
// import https from "https";
// import fs from "fs";
import app from "./app.js";
import pool from "./config/pg.js";

const { PORT, DOCKER_PORT, NODE_ENV } = process.env;

const server = app.listen(PORT, () => {
  console.log(`Fincore serving running port: ${DOCKER_PORT} IN ${NODE_ENV}`);
});

// process.on("SIGINT", () => {
//   server.close(() => {
//     console.log("Server closed");
//     process.exit(1);
//   });
// });
