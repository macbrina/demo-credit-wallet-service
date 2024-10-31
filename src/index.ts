import "module-alias/register";
import express from "express";
import userRoutes from "@/routes/userRoutes";
import bodyParser from "body-parser";
import isAuth from "@/middlewares/isAuth";

const app = express();

app.use(bodyParser.json());

app.use(isAuth);

app.use("/api/users", userRoutes);

app.listen(process.env.PORT || 3000);
