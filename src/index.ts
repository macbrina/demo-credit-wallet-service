import "module-alias/register";
import { NextFunction, Request, Response } from "express";

import { CustomError } from "@/errors/customError";
import isAuth from "@/middlewares/isAuth";
import userRoutes from "@/routes/userRoutes";
import walletRoutes from "@/routes/walletRoutes";
import transactionRoutes from "@/routes/transactionRoutes";
import bodyParser from "body-parser";
import express from "express";
import { Server } from "http";

const app = express();

app.use(bodyParser.json());

app.use("/api/users", userRoutes);

app.use(isAuth);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);

app.use(
  (error: CustomError, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
  }
);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT);
}

export default app;
