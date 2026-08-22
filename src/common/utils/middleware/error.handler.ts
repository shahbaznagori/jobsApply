import { NextFunction, Request, Response } from "express";
import apiResponse from "../response";

const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  return apiResponse(
    res,
    500,
    false,
    error.message || "Internal server error"
  );
};

export default errorHandler;