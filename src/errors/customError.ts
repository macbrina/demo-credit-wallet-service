export class CustomError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = "CustomError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}
