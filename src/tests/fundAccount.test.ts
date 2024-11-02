import app from "@/index";
import request from "supertest";

import { depositAmount, negativeAmount } from "./testData";
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

describe("Fund Account", () => {
  it("should fund account successfully", async () => {
    const fundData = {
      amount: depositAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/deposit`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(fundData);

    expect(response.status).toBe(200);
    expect(response.body.data.transaction_amount).toBe(50);
  });

  it("should fail if the amount is invalid", async () => {
    const fundData = {
      amount: negativeAmount,
      wallet_pin: sender.walletPin,
    };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/deposit`)
      .set("Authorization", `Bearer ${sender.token}`)
      .send(fundData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation errors occurred");
  });

  it("should fail if user is not logged in", async () => {
    const fundData = { amount: depositAmount, wallet_pin: sender.walletPin };

    const response = await request(app)
      .post(`/api/wallets/${sender.walletId}/deposit`)
      .send(fundData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized access");
  });
});
