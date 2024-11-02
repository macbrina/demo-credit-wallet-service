import app from "@/index";
import request from "supertest";

import { higherAmount, negativeAmount, withdrawAmount } from "./testData";
import { closeServer, startServer } from "./testSetup";

import { createTestUser, deleteTestUser, TestUser } from "./userTestUtils";

let sender: TestUser;

beforeAll(async () => {
  await startServer();

  sender = await createTestUser();
}, 15000);

afterAll(async () => {
  await deleteTestUser(sender.email);
  await closeServer();
});

describe("Withdraw Funds", () => {
  it("should withdraw funds successfully if balance is sufficient", async () => {
    const withdrawData = {
      amount: withdrawAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/withdraw`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(withdrawData);

    expect(response.status).toBe(200);
    expect(response.body.data.transaction_amount).toBe(withdrawAmount);
  });

  it("should fail if balance is insufficient", async () => {
    const withdrawData = {
      amount: higherAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/withdraw`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(withdrawData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient balance");
  });

  it("should fail if the amount is invalid", async () => {
    const withdrawData = {
      amount: negativeAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/withdraw`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(withdrawData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const withdrawData = {
      amount: withdrawAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/withdraw`)
      .send(withdrawData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
