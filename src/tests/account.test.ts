import app from "@/index";
import request from "supertest";
import { closeServer, startServer } from "./testSetup";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await closeServer();
});

describe("User Account Creation", () => {
  it("should create an account successfully", async () => {
    const userData = {
      email: "testuser@gmail.com",
      name: "Test User",
      phone_number: "+2348033449323",
      wallet_pin: "1234",
      password: "@TestUser12345",
    };

    const response = await request(app)
      .post("/api/users/register-user")
      .send(userData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("walletId");
  });

  it("should fail if user is in blacklist", async () => {
    const userData = {
      email: "blacklistuser@gmail.com",
      name: "Blacklisted User",
      phone_number: "+2348033449323",
      wallet_pin: "1234",
      password: "@BlacklistedUser12345",
      identity: "0zspgifzbo.ga",
    };

    const response = await request(app)
      .post("/api/users/register-user")
      .send(userData);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Access denied: Insufficient karma score"
    );
  });
});
