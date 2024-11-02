import app from "@/index";
import request from "supertest";

import { depositAmount, negativeAmount, walletId, walletPin } from "./testData";
import { closeServer, getToken, startServer } from "./testSetup";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await closeServer();
});

describe("Fund Account", () => {
  it("should fund account successfully", async () => {
    const fundData = {
      amount: depositAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/deposit`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(fundData);

    expect(response.status).toBe(200);
    expect(response.body.data.transaction_amount).toBe(50);
  });

  it("should fail if the amount is invalid", async () => {
    const fundData = {
      amount: negativeAmount,
      wallet_pin: walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/deposit`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(fundData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const fundData = { amount: depositAmount, wallet_pin: walletPin };

    const response = await request(app)
      .post(`/api/wallets/${walletId}/deposit`)
      .send(fundData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});