import request from "supertest";
import app from "@/index";
import User from "@/models/userModel";

export interface TestUser {
  email: string;
  walletId: string;
  walletPin: string;
  token: string;
  transactionId: string;
}

export const createTestUser = async (
  recipient?: boolean
): Promise<TestUser> => {
  let senderEmail: string;

  if (recipient) {
    senderEmail = "recipient@example.com";
  } else {
    senderEmail = "sender@example.com";
  }

  const senderData = {
    email: senderEmail,
    name: "Sender User",
    phone_number: "2348033449323",
    wallet_pin: "1234",
    password: "@TestUser12345",
  };

  const senderRegisterResponse = await request(app)
    .post("/api/users/register")
    .send(senderData);
  if (senderRegisterResponse.status !== 201) {
    throw new Error("Failed to create sender user");
  }

  const senderLoginResponse = await request(app).post("/api/users/login").send({
    email: senderEmail,
    password: "@TestUser12345",
  });
  if (senderLoginResponse.status !== 200) {
    throw new Error("Failed to log in test user");
  }

  const senderWalletId = senderRegisterResponse.body.data.walletId;
  const senderToken = senderLoginResponse.body.data.token;

  const senderDepositResponse = await request(app)
    .post(`/api/wallets/${senderWalletId}/deposit`)
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ wallet_pin: senderData["wallet_pin"], amount: 1000 });
  if (senderDepositResponse.status !== 200) {
    throw new Error("Failed to create deposit transaction");
  }

  return {
    email: senderEmail,
    walletId: senderWalletId,
    walletPin: senderData.wallet_pin,
    token: senderToken,
    transactionId: senderDepositResponse.body.data.transaction_id,
  };
};

export const deleteTestUser = async (email: string) => {
  if (email) {
    await User.deleteUser(email);
  }
  return;
};
