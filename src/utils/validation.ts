import User from "@/models/userModel";
import UserWallet from "@/models/walletModel";
import axios from "axios";
import bcrypt from "bcrypt";
import logger from "./logger";
import {
  userLoginSchema,
  userSignupSchema,
  userWalletSchema,
} from "./validationSchemas";

export const validateUserCreationInput = async (
  userData: any
): Promise<string[]> => {
  const errors: string[] = [];

  const { error } = userSignupSchema.validate(userData);
  if (error) {
    errors.push(...error.details.map((detail) => detail.message));
  }

  try {
    const existingUser = await User.findUserByEmail(userData.email);
    if (existingUser) {
      errors.push("User already exists with this email.");
      return errors;
    }
  } catch (error) {
    logger.error("Error validating email", error);
  }

  return errors;
};

export const validateUserLoginInput = (userData: any) => {
  const errors: string[] = [];

  const { error } = userLoginSchema.validate(userData);

  if (error) {
    errors.push(...error.details.map((detail) => detail.message));
    return errors;
  }

  return errors;
};

export const checkUserKarma = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${process.env.LENDSQR_API_URL}/verification/karma/${email}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LENDSQR_SECRET_KEY}`,
        },
      }
    );

    const { data } = response;

    return !!data?.data?.karma_identity;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }

    logger.error((error as Error).message || "Error checking user karma");
    throw new Error("Error checking user karma");
  }
};

export const validateWalletCredentials = async (
  walletData: any
): Promise<string[]> => {
  const errors: string[] = [];

  const { error } = userWalletSchema.validate(walletData);

  if (error) {
    errors.push(...error.details.map((detail) => detail.message));
    return errors;
  }

  try {
    const walletExists = await UserWallet.findUserWalletById(
      walletData.wallet_id
    );
    if (!walletExists) {
      errors.push("Invalid wallet ID");
      return errors;
    }

    const passwordMatch = await bcrypt.compare(
      walletData.wallet_pin,
      walletExists.wallet_pin
    );

    if (!passwordMatch) {
      errors.push("Incorrect wallet PIN");
      return errors;
    }
  } catch (error) {
    logger.error((error as Error).message || "Error validating wallet ID");
    throw new Error("Error validating wallet ID: " + (error as Error).message);
  }

  return errors;
};
