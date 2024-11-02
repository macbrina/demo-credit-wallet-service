import app from "@/index";
import { Server } from "http";
import db from "../../db";

jest.useRealTimers();

let server: Server | null = null;

const getRandomPort = () => Math.floor(Math.random() * (65535 - 1024) + 1024);

export const startServer = async () => {
  if (!server) {
    const port = getRandomPort();
    server = app.listen(port);
  }
};

export const closeServer = async () => {
  if (server) {
    await db.destroy();
    server.close();
    server = null;
  }
};
