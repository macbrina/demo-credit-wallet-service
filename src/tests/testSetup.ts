import { Server } from "http";
import request from "supertest";
import app from "@/index";
import db from "../../db";

let server: Server | null = null;
let token: string | null = null;

const getRandomPort = () => Math.floor(Math.random() * (65535 - 1024) + 1024);

export const startServer = async () => {
  if (!server) {
    const port = getRandomPort();
    server = app.listen(port);

    const response = await request(app).post("/api/users/login").send({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    });
    token = response.body.data.token;
  }
};

export const closeServer = async () => {
  if (server) {
    await db.destroy();
    server.close();
    server = null;
  }
};

export const getToken = () => {
  if (!token) {
    throw new Error("Token not initialized. Please call startServer() first.");
  }
  return token;
};
