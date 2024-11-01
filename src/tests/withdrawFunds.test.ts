import app from "@/index";
import request from "supertest";

import {
  higherAmount,
  negativeAmount,
  walletId,
  walletPin,
  withdrawAmount,
} from "./testData";
import { closeServer, getToken, startServer } from "./testSetup";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await closeServer();
});

describe("Withdraw Funds", () => {
  it("should withdraw funds successfully if balance is sufficient", async () => {
    const withdrawData = {
      amount: withdrawAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/withdraw`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(withdrawData);

    expect(response.status).toBe(200);
    expect(response.body.transaction_amount).toBe(withdrawAmount);
  });

  it("should fail if balance is insufficient", async () => {
    const withdrawData = {
      amount: higherAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/withdraw`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(withdrawData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Insufficient balance");
  });

  it("should fail if the amount is invalid", async () => {
    const withdrawData = {
      amount: negativeAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/withdraw`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(withdrawData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const withdrawData = { amount: withdrawAmount, wallet_pin: walletPin };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/withdraw`)
      .send(withdrawData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
