import app from "@/index";
import request from "supertest";

import { closeServer, startServer } from "./testSetup";
import { TestUser, createTestUser, deleteTestUser } from "./userTestUtils";

let sender: TestUser;

beforeAll(async () => {
  await startServer();

  sender = await createTestUser();
}, 15000);

afterAll(async () => {
  await deleteTestUser(sender.email);
  await closeServer();
});

describe("View Transactions", () => {
  it("should return all transactions for the user", async () => {
    const response = await request(app)
      .get(`/api/transactions/${sender.walletId}/all`)
      .set("Authorization", `Bearer ${sender.token}`);
    expect(response.status).toBe(200);

    if (response.body.data.length > 0) {
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty("transaction_id");
    } else {
      expect(response.body.message).toBe(
        "No transactions found for the specified criteria."
      );
    }
  });

  it("should return a single transaction by ID", async () => {
    const response = await request(app)
      .get(`/api/transactions/${sender.transactionId}`)
      .set("Authorization", `Bearer ${sender.token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.transaction_id).toBe(sender.transactionId);
  });

  it("should return error for non-existent transaction ID", async () => {
    const response = await request(app)
      .get(`/api/transactions/invalidId`)
      .set("Authorization", `Bearer ${sender.token}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Transaction not found");
  });

  it("should fail if user is not logged in", async () => {
    const response = await request(app).get(
      `/api/transactions/${sender.walletId}/all`
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});

describe("Check Wallet Balance", () => {
  it("should return the balance of the user's wallet", async () => {
    const response = await request(app)
      .get(`/api/wallets/${sender.walletId}/balance`)
      .set("Authorization", `Bearer ${sender.token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("balance");
  });

  it("should fail if user is not logged in", async () => {
    const response = await request(app).get(
      `/api/wallets/${sender.walletId}/balance`
    );
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
