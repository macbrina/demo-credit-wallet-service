import "module-alias/register";
import { NextFunction, Request, Response } from "express";

import { CustomError } from "@/errors/customError";
import isAuth from "@/middlewares/isAuth";
import userRoutes from "@/routes/userRoutes";
import walletRoutes from "@/routes/walletRoutes";
import bodyParser from "body-parser";
import express from "express";

const app = express();

app.use(bodyParser.json());

app.use(isAuth);

app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);

app.use(
  (error: CustomError, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
  }
);

app.listen(process.env.PORT || 3000);
