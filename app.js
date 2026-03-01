import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/authRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import globalErrHandler from "./middlewares/globalErrHandler.js";
import unhandledRoutes from "./middlewares/unhandledRoutes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/transaction", transactionRouter);

app.use(unhandledRoutes);
app.use(globalErrHandler);

export default app;
