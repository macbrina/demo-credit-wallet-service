import app from "@/index";
import request from "supertest";

import {
  higherAmount,
  nonExistentWalletId,
  recipientWalletId,
  transferAmount,
  walletPin,
} from "./testData";
import { closeServer, getToken, startServer } from "./testSetup";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await closeServer();
});

describe("Transfer Funds", () => {
  it("should transfer funds successfully between two accounts", async () => {
    const transferData = {
      amount: transferAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${recipientWalletId}/transfer`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(transferData);

    expect(response.status).toBe(200);
    expect(response.body.data.transaction_amount).toBe(transferAmount);
    expect(response.body.data.recipient_wallet_id).toBe(recipientWalletId);
  });

  it("should fail if balance is insufficient", async () => {
    const transferData = {
      amount: higherAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${recipientWalletId}/transfer`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(transferData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient balance");
  });

  it("should fail if the recipient does not exist", async () => {
    const transferData = {
      amount: transferAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${nonExistentWalletId}/transfer`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(transferData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const transferData = { amount: transferAmount, wallet_pin: walletPin };

    const response = await request(app)
      .post(`/api/wallets/${recipientWalletId}/transfer`)
      .send(transferData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
