import app from "@/index";
import request from "supertest";

import { higherAmount, nonExistentWalletId, transferAmount } from "./testData";
import { closeServer, startServer } from "./testSetup";
import { createTestUser, deleteTestUser, TestUser } from "./userTestUtils";

let sender: TestUser;
let receiver: TestUser;

beforeAll(async () => {
  await startServer();

  sender = await createTestUser();
  receiver = await createTestUser();
}, 15000);

afterAll(async () => {
  await deleteTestUser(sender.email);
  await deleteTestUser(receiver.email);
  await closeServer();
});

describe("Transfer Funds", () => {
  it("should transfer funds successfully between two accounts", async () => {
    const transferData = {
      amount: transferAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${receiver.walletId}/transfer`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(transferData);

    expect(response.status).toBe(200);
    expect(response.body.data.transaction_amount).toBe(transferAmount);
    expect(response.body.data.recipient_wallet_id).toBe(receiver.walletId);
  });

  it("should fail if balance is insufficient", async () => {
    const transferData = {
      amount: higherAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${receiver.walletId}/transfer`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(transferData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient balance");
  });

  it("should fail if the recipient does not exist", async () => {
    const transferData = {
      amount: transferAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${nonExistentWalletId}/transfer`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(transferData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const transferData = {
      amount: transferAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${receiver.walletId}/transfer`)
      .send(transferData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
