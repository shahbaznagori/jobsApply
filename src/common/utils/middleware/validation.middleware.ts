import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import apiResponse from "../response";

const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return apiResponse(
      res,
      400,
      false,
      errors.array()[0].msg,
      errors.array()
    );
  }

  next();
};

export default validationMiddleware;