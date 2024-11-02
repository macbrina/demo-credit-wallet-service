import app from "@/index";
import request from "supertest";
import User from "@/models/userModel";
import { closeServer, startServer } from "./testSetup";

const generateUniqueEmail = () => `testuser_${Date.now()}@gmail.com`;

let testUserEmail = generateUniqueEmail();
let testUserData = {
  email: testUserEmail,
  name: "Test User",
  phone_number: "2348033449323",
  wallet_pin: "1234",
  password: "@TestUser12345",
};

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await User.deleteUser(testUserEmail);
  await closeServer();
});

describe("User Account Creation", () => {
  it("should create an account successfully", async () => {
    const response = await request(app)
      .post("/api/users/register")
      .send(testUserData);
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("walletId");
  });

  it("should fail if an account exists already", async () => {
    const response = await request(app)
      .post("/api/users/register")
      .send(testUserData);
    expect(response.status).toBe(400);
    expect(response.body.data[0]).toBe("User already exists with this email.");
  });

  it("should fail if user is in blacklist", async () => {
    const userData = {
      email: "blacklistuser@gmail.com",
      name: "Blacklisted User",
      phone_number: "2348033449323",
      wallet_pin: "1234",
      password: "@BlacklistedUser12345",
      identity: "0zspgifzbo.ga",
    };

    const response = await request(app)
      .post("/api/users/register")
      .send(userData);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Access denied: Insufficient karma score"
    );
  });
});

describe("User Account Login", () => {
  it("should log into account successfully", async () => {
    const userData = {
      email: testUserEmail,
      password: "@TestUser12345",
    };

    const response = await request(app).post("/api/users/login").send(userData);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("token");
  });

  it("should fail if user is in blacklist", async () => {
    const userData = {
      email: "blacklistuser@gmail.com",
      password: "@BlacklistedUser12345",
      identity: "0zspgifzbo.ga",
    };

    const response = await request(app).post("/api/users/login").send(userData);
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Access denied: Insufficient karma score"
    );
  });
});
