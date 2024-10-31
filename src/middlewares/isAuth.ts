import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    req.isAuth = true;
    return next();
  }

  const token = authHeader.split(" ")[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as CustomJwtPayload;
  } catch (error) {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;

  next();
};

export default isAuth;
