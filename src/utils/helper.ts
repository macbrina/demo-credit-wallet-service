export const generateRandomNumber = (numDigits: number): number => {
  if (numDigits < 1) {
    throw new Error("Number of digits must be at least 1");
  }

  const min = Math.pow(10, numDigits - 1);
  const max = Math.pow(10, numDigits) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isBalanceSufficient = (
  available_balance: number,
  amount: number
): boolean => {
  return available_balance >= amount;
};
