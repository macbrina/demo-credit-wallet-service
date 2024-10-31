import { Router } from "express";
import { Request, Response } from "express";

import UserController from "@/controllers/userController";

const router = Router();

router.post("/create-user", async (req: Request, res: Response) => {
  await UserController.createUser(req, res);
});

router.post("/login-user", async (req: Request, res: Response) => {
  await UserController.loginUser(req, res);
});

export default router;
