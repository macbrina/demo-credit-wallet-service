import { NextFunction, Request, Response, Router } from "express";

import UserController from "@/controllers/userController";

const router = Router();

router.post(
  "/register-user",
  async (req: Request, res: Response, next: NextFunction) => {
    await UserController.createUser(req, res, next);
  }
);

router.post(
  "/login-user",
  async (req: Request, res: Response, next: NextFunction) => {
    await UserController.loginUser(req, res, next);
  }
);

export default router;
