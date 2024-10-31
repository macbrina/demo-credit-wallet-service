import User from "@/models/userModel";
import axios from "axios";
import logger from "./logger";

export const validateUserCreationInput = async (
  userData: any
): Promise<string[]> => {
  const errors: string[] = [];

  if (!userData.name || typeof userData.name !== "string") {
    errors.push("Name is required and should be a string");
  }

  if (
    !userData.email ||
    typeof userData.email !== "string" ||
    !validateEmail(userData.email)
  ) {
    errors.push("Email is required and should be a valid email address");
  } else {
    const existingUser = await User.findUserByEmail(userData.email);
    if (existingUser) {
      errors.push("User already exists with this email.");
      return errors;
    }
  }

  if (!userData.phone_number || typeof userData.phone_number !== "string") {
    errors.push("Phone number is required and should be a valid phone number");
  }

  if (!userData.password || typeof userData.password !== "string") {
    errors.push("Password is required and should be a string");
  } else {
    const passwordErrors = validatePassword(userData.password);
    errors.push(...passwordErrors);
  }

  return errors;
};

export const validateUserLoginInput = (userData: any) => {
  const errors: string[] = [];

  if (
    !userData.email ||
    typeof userData.email !== "string" ||
    !validateEmail(userData.email)
  ) {
    errors.push("Email is required and should be a valid email address");
  }

  if (!userData.password || typeof userData.password !== "string") {
    errors.push("Password is required");
  }

  return errors;
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors;
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
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
      logger.warn(
        (error as Error).message || "Identity not found in karma ecosystem"
      );
      return false;
    }

    logger.error((error as Error).message || "Error checking user karma");
    throw new Error("Error checking user karma");
  }
};
