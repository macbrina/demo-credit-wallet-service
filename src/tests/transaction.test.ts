import app from "@/index";
import request from "supertest";

import { transactionId, walletId } from "./testData";
import { closeServer, getToken, startServer } from "./testSetup";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await closeServer();
});

describe("View Transactions", () => {
  it("should return all transactions for the user", async () => {
    const response = await request(app)
      .get(`/api/transactions/${walletId}/all`)
      .set("Authorization", `Bearer ${getToken()}`);
    expect(response.status).toBe(200);

    if (response.body.data.length > 0) {
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[1]).toHaveProperty("transaction_id");
    } else {
      expect(response.body.message).toBe(
        "No transactions found for the specified criteria."
      );
    }
  });

  it("should return a single transaction by ID", async () => {
    const response = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${getToken()}`);
    expect(response.status).toBe(200);
    expect(response.body.data.transaction_id).toBe(transactionId);
  });

  it("should return error for non-existent transaction ID", async () => {
    const response = await request(app)
      .get(`/api/transactions/invalidId`)
      .set("Authorization", `Bearer ${getToken()}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Transaction not found");
  });

  it("should fail if user is not logged in", async () => {
    const response = await request(app).get(
      `/api/transactions/${walletId}/all`
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});

describe("Check Wallet Balance", () => {
  it("should return the balance of the user's wallet", async () => {
    const response = await request(app)
      .get(`/api/wallets/${walletId}/balance`)
      .set("Authorization", `Bearer ${getToken()}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("balance");
  });

  it("should fail if user is not logged in", async () => {
    const response = await request(app).get(`/api/wallets/${walletId}/balance`);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
